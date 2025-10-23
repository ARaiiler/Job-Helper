import { ChromaApi, OpenAIEmbeddingFunction } from 'chromadb';
import { v4 as uuidv4 } from 'uuid';
import { ProfileChunk, TailoredContent, ResumePreview, Job, JobAnalysis, WorkExperience, Skill, Education } from '../shared/types';

export default class RAGService {
  private client: ChromaApi;
  private collection: any;
  private embeddingFunction: OpenAIEmbeddingFunction;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new ChromaApi();
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: apiKey,
      openai_model: 'text-embedding-3-small'
    });
  }

  async initialize(): Promise<void> {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: 'profile_embeddings',
        embeddingFunction: this.embeddingFunction,
        metadata: { description: 'User profile data for resume tailoring' }
      });
    } catch (error) {
      console.error('Failed to initialize ChromaDB:', error);
      throw error;
    }
  }

  async chunkProfileData(workExperience: WorkExperience[], skills: Skill[], education: Education[]): Promise<ProfileChunk[]> {
    const chunks: ProfileChunk[] = [];

    // Chunk work achievements
    workExperience.forEach(exp => {
      exp.achievements.forEach((achievement, index) => {
        chunks.push({
          id: uuidv4(),
          content: `Work Achievement at ${exp.company} as ${exp.title}: ${achievement}`,
          type: 'work_achievement',
          metadata: {
            source_id: exp.id!,
            date: exp.start_date,
            relevance_score: 1.0
          }
        });
      });

      // Add job description as chunk
      if (exp.description) {
        chunks.push({
          id: uuidv4(),
          content: `Job Description at ${exp.company} as ${exp.title}: ${exp.description}`,
          type: 'work_achievement',
          metadata: {
            source_id: exp.id!,
            date: exp.start_date,
            relevance_score: 0.8
          }
        });
      }
    });

    // Chunk skills with context
    skills.forEach(skill => {
      chunks.push({
        id: uuidv4(),
        content: `Skill: ${skill.name} (${skill.category}) - Proficiency Level: ${skill.proficiency_level}/5`,
        type: 'skill',
        metadata: {
          source_id: skill.id!,
          date: skill.created_at || new Date().toISOString(),
          relevance_score: skill.proficiency_level / 5
        }
      });
    });

    // Chunk education
    education.forEach(edu => {
      const educationText = `${edu.degree} in ${edu.field || 'General Studies'} from ${edu.institution}`;
      chunks.push({
        id: uuidv4(),
        content: `Education: ${educationText}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}`,
        type: 'education',
        metadata: {
          source_id: edu.id!,
          date: edu.start_date,
          relevance_score: 1.0
        }
      });
    });

    return chunks;
  }

  async indexProfileChunks(chunks: ProfileChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    try {
      const ids = chunks.map(chunk => chunk.id);
      const contents = chunks.map(chunk => chunk.content);
      const metadatas = chunks.map(chunk => ({
        type: chunk.type,
        source_id: chunk.metadata.source_id,
        date: chunk.metadata.date,
        relevance_score: chunk.metadata.relevance_score
      }));

      await this.collection.add({
        ids,
        documents: contents,
        metadatas
      });
    } catch (error) {
      console.error('Failed to index profile chunks:', error);
      throw error;
    }
  }

  async queryRelevantChunks(jobAnalysis: JobAnalysis, limit: number = 10): Promise<ProfileChunk[]> {
    if (!this.collection) {
      throw new Error('ChromaDB collection not initialized');
    }

    try {
      // Create query from job requirements
      const queryText = [
        ...jobAnalysis.required_skills,
        ...jobAnalysis.preferred_skills,
        ...jobAnalysis.ats_keywords,
        jobAnalysis.experience_level
      ].join(' ');

      const results = await this.collection.query({
        queryTexts: [queryText],
        nResults: limit
      });

      // Convert results to ProfileChunk format
      const chunks: ProfileChunk[] = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          chunks.push({
            id: results.ids[0][i],
            content: results.documents[0][i],
            type: results.metadatas[0][i].type,
            metadata: {
              source_id: results.metadatas[0][i].source_id,
              date: results.metadatas[0][i].date,
              relevance_score: results.distances[0][i] ? 1 - results.distances[0][i] : 0.5
            }
          });
        }
      }

      return chunks;
    } catch (error) {
      console.error('Failed to query relevant chunks:', error);
      throw error;
    }
  }

  async generateTailoredResume(job: Job, relevantChunks: ProfileChunk[]): Promise<TailoredContent> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const analysis = job.analysis_data;
    if (!analysis) {
      throw new Error('Job must be analyzed before generating tailored resume');
    }

    // Prepare context from relevant chunks
    const context = relevantChunks.map(chunk => chunk.content).join('\n\n');

    const prompt = `You are an expert resume writer. Create tailored resume content based on the job requirements and user's profile.

JOB REQUIREMENTS:
- Company: ${job.company}
- Position: ${job.position}
- Required Skills: ${analysis.required_skills.join(', ')}
- Preferred Skills: ${analysis.preferred_skills.join(', ')}
- Experience Level: ${analysis.experience_level}
- Key Responsibilities: ${analysis.key_responsibilities.join(', ')}
- ATS Keywords: ${analysis.ats_keywords.join(', ')}

USER PROFILE CONTEXT:
${context}

TASK: Create tailored resume content that:
1. Highlights experiences most relevant to this job
2. Rewrites achievements using job-specific keywords
3. Emphasizes skills that match job requirements
4. Uses ATS-friendly language and action verbs
5. Quantifies achievements where possible
6. Is factually accurate (no hallucinations)

Return ONLY a valid JSON object with this structure:
{
  "selected_experiences": [
    {
      "id": 1,
      "original": "Original experience text",
      "tailored": "Tailored experience text with job-specific keywords"
    }
  ],
  "rewritten_achievements": [
    {
      "id": 1,
      "original": "Original achievement",
      "tailored": "Rewritten achievement with quantified results"
    }
  ],
  "skills_to_highlight": ["skill1", "skill2"],
  "custom_summary": "Tailored professional summary for this specific role"
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert resume writer specializing in ATS optimization and job-specific tailoring. Always return valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No tailored content received from OpenAI');
      }

      const tailoredContent = JSON.parse(content);
      
      return {
        ...tailoredContent,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Resume tailoring failed:', error);
      throw error;
    }
  }

  async generateResumePreview(originalContent: string, tailoredContent: TailoredContent): Promise<ResumePreview> {
    // This would typically involve more sophisticated diffing
    // For now, we'll create a simple preview
    const changes = [
      {
        type: 'modified' as const,
        content: 'Experience descriptions updated with job-specific keywords'
      },
      {
        type: 'added' as const,
        content: `Custom summary: ${tailoredContent.custom_summary}`
      }
    ];

    return {
      original: originalContent,
      tailored: `TAILORED RESUME CONTENT:\n\n${JSON.stringify(tailoredContent, null, 2)}`,
      changes
    };
  }

  async clearEmbeddings(): Promise<void> {
    try {
      await this.collection.delete();
      await this.initialize();
    } catch (error) {
      console.error('Failed to clear embeddings:', error);
      throw error;
    }
  }

  async reindexProfile(workExperience: WorkExperience[], skills: Skill[], education: Education[]): Promise<void> {
    try {
      // Clear existing embeddings
      await this.clearEmbeddings();
      
      // Create new chunks
      const chunks = await this.chunkProfileData(workExperience, skills, education);
      
      // Index new chunks
      await this.indexProfileChunks(chunks);
    } catch (error) {
      console.error('Failed to reindex profile:', error);
      throw error;
    }
  }
}
