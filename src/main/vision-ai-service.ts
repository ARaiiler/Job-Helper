import { VisionAnalysis, VisionField, PersonalInfo } from '../shared/types';

export default class VisionAIService {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4-vision-preview') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyzeFormScreenshot(screenshotPath: string, personalInfo: PersonalInfo): Promise<VisionAnalysis> {
    const startTime = Date.now();

    try {
      // Read screenshot file
      const fs = require('fs');
      const screenshotBuffer = fs.readFileSync(screenshotPath);
      const base64Image = screenshotBuffer.toString('base64');

      // Prepare the prompt
      const prompt = this.createAnalysisPrompt(personalInfo);

      // Call OpenAI Vision API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;

      // Parse the JSON response
      const fields = this.parseAnalysisResponse(analysisText, personalInfo);
      
      const analysisTime = Date.now() - startTime;

      return {
        fields,
        confidence: this.calculateConfidence(fields),
        analysisTime: `${analysisTime}ms`,
        model: this.model
      };

    } catch (error) {
      console.error('Vision analysis failed:', error);
      throw new Error(`Vision analysis failed: ${error}`);
    }
  }

  private createAnalysisPrompt(personalInfo: PersonalInfo): string {
    return `Analyze this job application form screenshot and identify all form fields. For each field, extract the following information:

1. Label text (what the field is asking for)
2. Field type (text, email, tel, select, textarea, file, checkbox, radio)
3. Whether the field is required (marked with asterisk or "required")
4. Placeholder text if visible
5. For select fields, list available options if visible

Return the results as a JSON array with this exact structure:
[
  {
    "label": "First Name",
    "type": "text",
    "required": true,
    "placeholder": "Enter your first name",
    "confidence": 0.95
  },
  {
    "label": "Email Address",
    "type": "email", 
    "required": true,
    "placeholder": "your.email@example.com",
    "confidence": 0.98
  }
]

Important guidelines:
- Only include actual form input fields (not buttons, labels, or static text)
- Be precise with field types (email for email fields, tel for phone, etc.)
- Set confidence based on how clear the field identification is (0.0-1.0)
- If you can't clearly identify a field, set confidence below 0.7
- For select fields, include an "options" array if dropdown options are visible
- Focus on job application specific fields like name, email, phone, resume upload, etc.

User profile context for reference:
- Name: ${personalInfo.name}
- Email: ${personalInfo.email}
- Phone: ${personalInfo.phone || 'Not provided'}
- Location: ${personalInfo.location || 'Not provided'}
- LinkedIn: ${personalInfo.linkedin || 'Not provided'}
- Portfolio: ${personalInfo.portfolio || 'Not provided'}`;
  }

  private parseAnalysisResponse(responseText: string, personalInfo: PersonalInfo): VisionField[] {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const fields = JSON.parse(jsonMatch[0]);
      
      // Validate and enhance fields
      return fields.map((field: any) => {
        const enhancedField: VisionField = {
          label: field.label || 'Unknown Field',
          type: this.validateFieldType(field.type),
          required: Boolean(field.required),
          placeholder: field.placeholder,
          options: field.options,
          confidence: Math.max(0, Math.min(1, field.confidence || 0.5))
        };

        // Pre-fill with user data based on field analysis
        enhancedField.value = this.getPrefillValue(enhancedField, personalInfo);

        return enhancedField;
      });

    } catch (error) {
      console.error('Failed to parse vision analysis response:', error);
      throw new Error(`Failed to parse analysis response: ${error}`);
    }
  }

  private validateFieldType(type: string): VisionField['type'] {
    const validTypes: VisionField['type'][] = [
      'text', 'email', 'tel', 'select', 'textarea', 'file', 'checkbox', 'radio'
    ];
    
    return validTypes.includes(type) ? type : 'text';
  }

  private getPrefillValue(field: VisionField, personalInfo: PersonalInfo): string {
    const label = field.label.toLowerCase();
    
    // Name fields
    if (label.includes('first name') || label.includes('given name')) {
      return personalInfo.name.split(' ')[0] || '';
    }
    if (label.includes('last name') || label.includes('surname') || label.includes('family name')) {
      return personalInfo.name.split(' ').slice(1).join(' ') || '';
    }
    if (label.includes('full name') || label.includes('name')) {
      return personalInfo.name;
    }
    
    // Contact fields
    if (label.includes('email') || label.includes('e-mail')) {
      return personalInfo.email;
    }
    if (label.includes('phone') || label.includes('telephone') || label.includes('mobile')) {
      return personalInfo.phone || '';
    }
    if (label.includes('location') || label.includes('address') || label.includes('city')) {
      return personalInfo.location || '';
    }
    
    // Social fields
    if (label.includes('linkedin') || label.includes('linkedin profile')) {
      return personalInfo.linkedin || '';
    }
    if (label.includes('portfolio') || label.includes('website') || label.includes('personal website')) {
      return personalInfo.portfolio || '';
    }
    
    // Resume fields
    if (label.includes('resume') || label.includes('cv') || label.includes('curriculum vitae')) {
      return '[Resume file will be uploaded]';
    }
    
    return '';
  }

  private calculateConfidence(fields: VisionField[]): number {
    if (fields.length === 0) return 0;
    
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    return totalConfidence / fields.length;
  }
}
