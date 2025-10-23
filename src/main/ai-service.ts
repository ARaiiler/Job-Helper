import Store from 'electron-store';
import { JobAnalysis, ProfileMatch, Job, Skill, WorkExperience } from '../shared/types';

export default class AIService {
  private store: Store;
  private apiKey: string | null = null;
  private model: string = 'gpt-3.5-turbo';

  constructor() {
    this.store = new Store({
      encryptionKey: 'job-tracker-encryption-key-2024',
      name: 'job-tracker-settings'
    });
    
    this.loadSettings();
  }

  private loadSettings() {
    this.apiKey = this.store.get('openai-api-key', null) as string | null;
    this.model = this.store.get('openai-model', 'gpt-3.5-turbo') as string;
  }

  async saveApiKey(key: string): Promise<void> {
    this.apiKey = key;
    this.store.set('openai-api-key', key);
  }

  async saveModel(model: string): Promise<void> {
    this.model = model;
    this.store.set('openai-model', model);
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  getModel(): string {
    return this.model;
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('OpenAI API test failed:', error);
      return false;
    }
  }

  async analyzeJob(job: Job): Promise<JobAnalysis> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!job.description) {
      throw new Error('Job description is required for analysis');
    }

    const prompt = `Analyze this job description and extract the following information. Return ONLY a valid JSON object with no additional text:

{
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill1", "skill2"],
  "experience_level": "entry|mid|senior|lead|executive",
  "key_responsibilities": ["responsibility1", "responsibility2"],
  "ats_keywords": ["keyword1", "keyword2"]
}

Job Description:
${job.description}

Company: ${job.company}
Position: ${job.position}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert job analyst. Extract structured information from job descriptions. Always return valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No analysis content received from OpenAI');
      }

      // Parse the JSON response
      const analysis = JSON.parse(content);
      
      // Validate the response structure
      if (!analysis.required_skills || !Array.isArray(analysis.required_skills)) {
        throw new Error('Invalid analysis response: missing required_skills');
      }

      return {
        ...analysis,
        analysis_timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Job analysis failed:', error);
      throw error;
    }
  }

  async calculateProfileMatch(job: Job, userSkills: Skill[], userExperience: WorkExperience[]): Promise<ProfileMatch> {
    if (!job.analysis_data) {
      throw new Error('Job must be analyzed before calculating profile match');
    }

    const analysis = job.analysis_data;
    const userSkillNames = userSkills.map(skill => skill.name.toLowerCase());
    
    // Calculate skills match
    const requiredSkills = analysis.required_skills.map(skill => skill.toLowerCase());
    const preferredSkills = analysis.preferred_skills.map(skill => skill.toLowerCase());
    
    const matchedRequiredSkills = requiredSkills.filter(skill => 
      userSkillNames.some(userSkill => 
        userSkill.includes(skill) || skill.includes(userSkill)
      )
    );
    
    const matchedPreferredSkills = preferredSkills.filter(skill => 
      userSkillNames.some(userSkill => 
        userSkill.includes(skill) || skill.includes(userSkill)
      )
    );

    const skillsMatch = requiredSkills.length > 0 
      ? (matchedRequiredSkills.length / requiredSkills.length) * 100 
      : 0;

    // Calculate experience match based on work experience
    const experienceMatch = this.calculateExperienceMatch(analysis.experience_level, userExperience);

    // Calculate keyword match
    const allJobKeywords = [...analysis.ats_keywords, ...analysis.required_skills, ...analysis.preferred_skills]
      .map(keyword => keyword.toLowerCase());
    
    const matchedKeywords = allJobKeywords.filter(keyword =>
      userSkillNames.some(userSkill => 
        userSkill.includes(keyword) || keyword.includes(userSkill)
      )
    );

    const keywordMatch = allJobKeywords.length > 0 
      ? (matchedKeywords.length / allJobKeywords.length) * 100 
      : 0;

    // Calculate overall score (weighted average)
    const overallScore = (skillsMatch * 0.5) + (experienceMatch * 0.3) + (keywordMatch * 0.2);

    const missingSkills = requiredSkills.filter(skill => 
      !matchedRequiredSkills.includes(skill)
    );

    const matchedSkills = [...matchedRequiredSkills, ...matchedPreferredSkills];

    return {
      overall_score: Math.round(overallScore),
      skills_match: Math.round(skillsMatch),
      experience_match: Math.round(experienceMatch),
      keyword_match: Math.round(keywordMatch),
      missing_skills: missingSkills,
      matched_skills: matchedSkills
    };
  }

  private calculateExperienceMatch(requiredLevel: string, userExperience: WorkExperience[]): number {
    if (userExperience.length === 0) return 0;

    // Calculate years of experience
    const totalYears = userExperience.reduce((total, exp) => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date ? new Date(exp.end_date) : new Date();
      const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);

    // Map experience levels to years
    const levelMapping: { [key: string]: { min: number; max: number } } = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 10 },
      'lead': { min: 8, max: 15 },
      'executive': { min: 10, max: 20 }
    };

    const required = levelMapping[requiredLevel.toLowerCase()] || levelMapping['mid'];
    
    if (totalYears >= required.min && totalYears <= required.max) {
      return 100;
    } else if (totalYears < required.min) {
      return Math.max(0, (totalYears / required.min) * 100);
    } else {
      return Math.max(0, 100 - ((totalYears - required.max) / 5) * 20);
    }
  }
}
