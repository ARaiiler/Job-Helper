import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import { ResumeTemplate, PDFSettings, ResumeData, PersonalInfo, TailoredContent, WorkExperience, Education, Skill, Certification, JobAnalysis } from '../shared/types';

export default class PDFService {
  private templates: ResumeTemplate[] = [
    {
      id: 'modern-clean',
      name: 'Modern Clean',
      description: 'Clean, professional layout with modern typography',
      category: 'modern',
      preview: '' // Will be generated
    },
    {
      id: 'ats-optimized',
      name: 'ATS Optimized',
      description: 'Simple, ATS-friendly format with clear sections',
      category: 'ats',
      preview: ''
    },
    {
      id: 'creative-professional',
      name: 'Creative Professional',
      description: 'Stylish design with visual elements',
      category: 'creative',
      preview: ''
    }
  ];

  getTemplates(): ResumeTemplate[] {
    return this.templates;
  }

  async generateResume(resumeData: ResumeData, settings: PDFSettings): Promise<string> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Set up fonts based on settings
    const font = settings.font === 'serif' ? StandardFonts.TimesRoman : StandardFonts.Helvetica;
    const boldFont = settings.font === 'serif' ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold;
    
    // Set up colors based on scheme
    const colors = this.getColorScheme(settings.colorScheme);
    
    // Set up font sizes
    const fontSize = this.getFontSize(settings.fontSize);
    
    let yPosition = 750; // Start from top
    
    // Header with name and contact info
    yPosition = await this.addHeader(page, resumeData.personalInfo, font, boldFont, colors, fontSize, yPosition);
    
    // Professional Summary
    if (resumeData.tailoredContent.custom_summary) {
      yPosition = await this.addSection(page, 'Professional Summary', resumeData.tailoredContent.custom_summary, font, boldFont, colors, fontSize, yPosition);
    }
    
    // Work Experience (filtered by tailored content)
    const relevantExperience = this.filterRelevantExperience(resumeData.workExperience, resumeData.tailoredContent);
    if (relevantExperience.length > 0) {
      yPosition = await this.addWorkExperience(page, relevantExperience, resumeData.tailoredContent, font, boldFont, colors, fontSize, yPosition);
    }
    
    // Education
    if (resumeData.education.length > 0) {
      yPosition = await this.addEducation(page, resumeData.education, font, boldFont, colors, fontSize, yPosition);
    }
    
    // Skills (prioritized by job match)
    const relevantSkills = this.prioritizeSkills(resumeData.skills, resumeData.jobInfo.jobAnalysis);
    if (relevantSkills.length > 0) {
      yPosition = await this.addSkills(page, relevantSkills, font, boldFont, colors, fontSize, yPosition);
    }
    
    // Certifications
    if (resumeData.certifications.length > 0) {
      yPosition = await this.addCertifications(page, resumeData.certifications, font, boldFont, colors, fontSize, yPosition);
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const fileName = `${resumeData.jobInfo.company.replace(/[^a-zA-Z0-9]/g, '_')}_${resumeData.jobInfo.position.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    const filePath = path.join(process.cwd(), 'resumes', fileName);
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
  }

  private async addHeader(page: any, personalInfo: PersonalInfo, font: any, boldFont: any, colors: any, fontSize: any, yPosition: number): Promise<number> {
    // Name
    page.drawText(personalInfo.name, {
      x: 50,
      y: yPosition,
      size: fontSize.title,
      font: boldFont,
      color: colors.primary
    });
    
    yPosition -= fontSize.title + 10;
    
    // Contact info
    const contactInfo = [
      personalInfo.email,
      personalInfo.phone,
      personalInfo.location,
      personalInfo.linkedin,
      personalInfo.portfolio
    ].filter(Boolean).join(' • ');
    
    page.drawText(contactInfo, {
      x: 50,
      y: yPosition,
      size: fontSize.normal,
      font: font,
      color: colors.text
    });
    
    return yPosition - 20;
  }

  private async addSection(page: any, title: string, content: string, font: any, boldFont: any, colors: any, fontSize: any, yPosition: number): Promise<number> {
    // Section title
    page.drawText(title, {
      x: 50,
      y: yPosition,
      size: fontSize.section,
      font: boldFont,
      color: colors.primary
    });
    
    yPosition -= fontSize.section + 5;
    
    // Draw line under title
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 562, y: yPosition },
      thickness: 1,
      color: colors.primary
    });
    
    yPosition -= 10;
    
    // Content (wrap text)
    const wrappedText = this.wrapText(content, 500, fontSize.normal);
    for (const line of wrappedText) {
      if (yPosition < 50) break; // Prevent overflow
      
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize.normal,
        font: font,
        color: colors.text
      });
      
      yPosition -= fontSize.normal + 2;
    }
    
    return yPosition - 15;
  }

  private async addWorkExperience(page: any, experiences: WorkExperience[], tailoredContent: TailoredContent, font: any, boldFont: any, colors: any, fontSize: any, yPosition: number): Promise<number> {
    yPosition = await this.addSection(page, 'Professional Experience', '', font, boldFont, colors, fontSize, yPosition);
    
    for (const exp of experiences.slice(0, 3)) { // Limit to 3 most relevant
      if (yPosition < 100) break;
      
      // Company and title
      const titleText = `${exp.title} at ${exp.company}`;
      page.drawText(titleText, {
        x: 50,
        y: yPosition,
        size: fontSize.normal,
        font: boldFont,
        color: colors.text
      });
      
      yPosition -= fontSize.normal + 2;
      
      // Date range
      const dateRange = `${this.formatDate(exp.start_date)} - ${exp.end_date ? this.formatDate(exp.end_date) : 'Present'}`;
      page.drawText(dateRange, {
        x: 50,
        y: yPosition,
        size: fontSize.small,
        font: font,
        color: colors.secondary
      });
      
      yPosition -= fontSize.small + 5;
      
      // Description
      if (exp.description) {
        const wrappedDesc = this.wrapText(exp.description, 500, fontSize.small);
        for (const line of wrappedDesc.slice(0, 2)) { // Limit to 2 lines
          if (yPosition < 50) break;
          
          page.drawText(line, {
            x: 50,
            y: yPosition,
            size: fontSize.small,
            font: font,
            color: colors.text
          });
          
          yPosition -= fontSize.small + 2;
        }
      }
      
      // Tailored achievements
      const tailoredAchievements = tailoredContent.rewritten_achievements.filter(a => 
        experiences.some(e => e.id === a.id)
      );
      
      if (tailoredAchievements.length > 0) {
        for (const achievement of tailoredAchievements.slice(0, 2)) {
          if (yPosition < 50) break;
          
          const bulletText = `• ${achievement.tailored}`;
          const wrappedBullet = this.wrapText(bulletText, 500, fontSize.small);
          
          for (const line of wrappedBullet) {
            if (yPosition < 50) break;
            
            page.drawText(line, {
              x: 50,
              y: yPosition,
              size: fontSize.small,
              font: font,
              color: colors.text
            });
            
            yPosition -= fontSize.small + 2;
          }
        }
      }
      
      yPosition -= 10;
    }
    
    return yPosition;
  }

  private async addEducation(page: any, education: Education[], font: any, boldFont: any, colors: any, fontSize: any, yPosition: number): Promise<number> {
    yPosition = await this.addSection(page, 'Education', '', font, boldFont, colors, fontSize, yPosition);
    
    for (const edu of education.slice(0, 2)) { // Limit to 2 most recent
      if (yPosition < 50) break;
      
      const degreeText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}`;
      page.drawText(degreeText, {
        x: 50,
        y: yPosition,
        size: fontSize.normal,
        font: boldFont,
        color: colors.text
      });
      
      yPosition -= fontSize.normal + 2;
      
      const institutionText = `${edu.institution}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}`;
      page.drawText(institutionText, {
        x: 50,
        y: yPosition,
        size: fontSize.small,
        font: font,
        color: colors.secondary
      });
      
      yPosition -= fontSize.small + 10;
    }
    
    return yPosition;
  }

  private async addSkills(page: any, skills: Skill[], font: any, boldFont: any, colors: any, fontSize: any, yPosition: number): Promise<number> {
    yPosition = await this.addSection(page, 'Skills', '', font, boldFont, colors, fontSize, yPosition);
    
    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);
    
    for (const [category, categorySkills] of Object.entries(skillsByCategory)) {
      if (yPosition < 50) break;
      
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      page.drawText(`${categoryName}:`, {
        x: 50,
        y: yPosition,
        size: fontSize.small,
        font: boldFont,
        color: colors.text
      });
      
      yPosition -= fontSize.small + 2;
      
      const skillNames = categorySkills.map(s => s.name).join(', ');
      const wrappedSkills = this.wrapText(skillNames, 500, fontSize.small);
      
      for (const line of wrappedSkills) {
        if (yPosition < 50) break;
        
        page.drawText(line, {
          x: 50,
          y: yPosition,
          size: fontSize.small,
          font: font,
          color: colors.text
        });
        
        yPosition -= fontSize.small + 2;
      }
      
      yPosition -= 5;
    }
    
    return yPosition;
  }

  private async addCertifications(page: any, certifications: Certification[], font: any, boldFont: any, colors: any, fontSize: any, yPosition: number): Promise<number> {
    yPosition = await this.addSection(page, 'Certifications', '', font, boldFont, colors, fontSize, yPosition);
    
    for (const cert of certifications.slice(0, 3)) { // Limit to 3 most recent
      if (yPosition < 50) break;
      
      page.drawText(cert.name, {
        x: 50,
        y: yPosition,
        size: fontSize.small,
        font: boldFont,
        color: colors.text
      });
      
      yPosition -= fontSize.small + 2;
      
      const issuerText = `${cert.issuer}${cert.date ? ` • ${this.formatDate(cert.date)}` : ''}`;
      page.drawText(issuerText, {
        x: 50,
        y: yPosition,
        size: fontSize.small,
        font: font,
        color: colors.secondary
      });
      
      yPosition -= fontSize.small + 5;
    }
    
    return yPosition;
  }

  private filterRelevantExperience(experiences: WorkExperience[], tailoredContent: TailoredContent): WorkExperience[] {
    const relevantIds = tailoredContent.selected_experiences.map(exp => exp.id);
    return experiences.filter(exp => exp.id !== undefined && relevantIds.includes(exp.id));
  }

  private prioritizeSkills(skills: Skill[], jobAnalysis?: JobAnalysis): Skill[] {
    if (!jobAnalysis) return skills;
    
    const requiredSkills = jobAnalysis.required_skills.map(s => s.toLowerCase());
    const preferredSkills = jobAnalysis.preferred_skills.map(s => s.toLowerCase());
    
    return skills.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aRequired = requiredSkills.some(s => aName.includes(s) || s.includes(aName));
      const bRequired = requiredSkills.some(s => bName.includes(s) || s.includes(bName));
      const aPreferred = preferredSkills.some(s => aName.includes(s) || s.includes(aName));
      const bPreferred = preferredSkills.some(s => bName.includes(s) || s.includes(bName));
      
      if (aRequired && !bRequired) return -1;
      if (!aRequired && bRequired) return 1;
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      
      return b.proficiency_level - a.proficiency_level;
    });
  }

  private getColorScheme(scheme: string) {
    const schemes = {
      professional: {
        primary: rgb(0.2, 0.2, 0.2),
        secondary: rgb(0.4, 0.4, 0.4),
        text: rgb(0.1, 0.1, 0.1)
      },
      blue: {
        primary: rgb(0.0, 0.3, 0.6),
        secondary: rgb(0.2, 0.5, 0.8),
        text: rgb(0.1, 0.1, 0.1)
      },
      green: {
        primary: rgb(0.0, 0.5, 0.2),
        secondary: rgb(0.2, 0.7, 0.4),
        text: rgb(0.1, 0.1, 0.1)
      },
      purple: {
        primary: rgb(0.4, 0.2, 0.6),
        secondary: rgb(0.6, 0.4, 0.8),
        text: rgb(0.1, 0.1, 0.1)
      }
    };
    
    return schemes[scheme as keyof typeof schemes] || schemes.professional;
  }

  private getFontSize(size: string) {
    const sizes = {
      small: {
        title: 16,
        section: 12,
        normal: 10,
        small: 9
      },
      medium: {
        title: 18,
        section: 14,
        normal: 11,
        small: 10
      },
      large: {
        title: 20,
        section: 16,
        normal: 12,
        small: 11
      }
    };
    
    return sizes[size as keyof typeof sizes] || sizes.medium;
  }

  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      // Rough estimation of text width (this is simplified)
      const estimatedWidth = testLine.length * (fontSize * 0.6);
      
      if (estimatedWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  }
}
