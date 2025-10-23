import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { FieldMapping } from '../shared/types';
import * as path from 'path';
import Database from './database';
import AIService from './ai-service';
import RAGService from './rag-service';
import PDFService from './pdf-service';
import AutomationService from './automation-service';
import VisionAIService from './vision-ai-service';
import JobBoardProfilesService from './job-board-profiles-service';
import BatchProcessingService from './batch-processing-service';
import AnalyticsService from './analytics-service';
import ErrorLoggingService from './error-logging-service';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let database: Database | null = null;
let aiService: AIService | null = null;
let ragService: RAGService | null = null;
let pdfService: PDFService | null = null;
let automationService: AutomationService | null = null;
let visionAIService: VisionAIService | null = null;
let jobBoardService: JobBoardProfilesService | null = null;
let batchProcessingService: BatchProcessingService | null = null;
let analyticsService: AnalyticsService | null = null;
let errorLoggingService: ErrorLoggingService | null = null;

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize database
  const dbPath = path.join(app.getPath('userData'), 'job-tracker.db');
  database = new Database(dbPath);
  await database.initialize();

  // Initialize AI service
  aiService = new AIService();

  // Initialize RAG service
  const apiKey = aiService.getApiKey();
  if (apiKey) {
    ragService = new RAGService(apiKey);
    await ragService.initialize();
  }

  // Initialize PDF service
  pdfService = new PDFService();

  // Initialize Automation service
  automationService = new AutomationService();
  await automationService.initialize();

  // Initialize Vision AI service (will be configured when API key is available)
  visionAIService = new VisionAIService('', 'gpt-4-vision-preview');

  // Initialize Job Board Profiles service
  jobBoardService = new JobBoardProfilesService();

  // Initialize Batch Processing service
  batchProcessingService = new BatchProcessingService(database, automationService, jobBoardService);

  // Initialize Analytics service
  analyticsService = new AnalyticsService(database);

  // Initialize Error Logging service
  errorLoggingService = new ErrorLoggingService();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Set up IPC handlers
if (database) {
  // Personal Info handlers
  ipcMain.handle('personal-info:get', async () => {
    return await database!.getPersonalInfo();
  });

  ipcMain.handle('personal-info:save', async (_, data) => {
    return await database!.savePersonalInfo(data);
  });

  // Work Experience handlers
  ipcMain.handle('work-experience:get-all', async () => {
    return await database!.getAllWorkExperience();
  });

  ipcMain.handle('work-experience:save', async (_, data) => {
    return await database!.saveWorkExperience(data);
  });

  ipcMain.handle('work-experience:delete', async (_, id) => {
    return await database!.deleteWorkExperience(id);
  });

  // Education handlers
  ipcMain.handle('education:get-all', async () => {
    return await database!.getAllEducation();
  });

  ipcMain.handle('education:save', async (_, data) => {
    return await database!.saveEducation(data);
  });

  ipcMain.handle('education:delete', async (_, id) => {
    return await database!.deleteEducation(id);
  });

  // Skills handlers
  ipcMain.handle('skills:get-all', async () => {
    return await database!.getAllSkills();
  });

  ipcMain.handle('skills:save', async (_, data) => {
    return await database!.saveSkill(data);
  });

  ipcMain.handle('skills:delete', async (_, id) => {
    return await database!.deleteSkill(id);
  });

  // Certifications handlers
  ipcMain.handle('certifications:get-all', async () => {
    return await database!.getAllCertifications();
  });

  ipcMain.handle('certifications:save', async (_, data) => {
    return await database!.saveCertification(data);
  });

  ipcMain.handle('certifications:delete', async (_, id) => {
    return await database!.deleteCertification(id);
  });

  // Job handlers
  ipcMain.handle('jobs:get-all', async () => {
    return await database!.getAllJobs();
  });

  ipcMain.handle('jobs:get-by-id', async (_, id) => {
    return await database!.getJobById(id);
  });

  ipcMain.handle('jobs:save', async (_, data) => {
    return await database!.saveJob(data);
  });

  ipcMain.handle('jobs:delete', async (_, id) => {
    return await database!.deleteJob(id);
  });

  ipcMain.handle('jobs:get-stats', async () => {
    return await database!.getJobStats();
  });

  ipcMain.handle('jobs:get-recent-activity', async () => {
    return await database!.getRecentActivity();
  });

  // Application handlers
  ipcMain.handle('applications:get-by-job', async (_, jobId) => {
    return await database!.getApplicationsByJob(jobId);
  });

  ipcMain.handle('applications:save', async (_, data) => {
    return await database!.saveApplication(data);
  });

  ipcMain.handle('applications:delete', async (_, id) => {
    return await database!.deleteApplication(id);
  });

  // AI Analysis handlers
  ipcMain.handle('ai:analyze-job', async (_, jobId) => {
    const job = await database!.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    const analysis = await aiService!.analyzeJob(job);
    
    // Save analysis to database
    const updatedJob = { ...job, analysis_data: analysis, analyzed_at: new Date().toISOString() };
    await database!.saveJob(updatedJob);
    
    return analysis;
  });

  ipcMain.handle('ai:calculate-match', async (_, jobId) => {
    const job = await database!.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }
    
    // Get user profile data
    const [skills, workExperience] = await Promise.all([
      database!.getAllSkills(),
      database!.getAllWorkExperience()
    ]);
    
    const match = await aiService!.calculateProfileMatch(job, skills, workExperience);
    
    // Save match score to database
    const updatedJob = { ...job, match_score: match.overall_score };
    await database!.saveJob(updatedJob);
    
    return match;
  });

  ipcMain.handle('ai:test-connection', async () => {
    return await aiService!.testConnection();
  });

  // Settings handlers
  ipcMain.handle('settings:get-api-key', async () => {
    return aiService!.getApiKey();
  });

  ipcMain.handle('settings:save-api-key', async (_, key) => {
    await aiService!.saveApiKey(key);
  });

  ipcMain.handle('settings:get-model', async () => {
    return aiService!.getModel();
  });

  ipcMain.handle('settings:save-model', async (_, model) => {
    await aiService!.saveModel(model);
  });

  // RAG System handlers
  ipcMain.handle('rag:generate-tailored-resume', async (_, jobId) => {
    if (!ragService) {
      throw new Error('RAG service not initialized. Please configure your API key.');
    }

    const job = await database!.getJobById(jobId);
    if (!job || !job.analysis_data) {
      throw new Error('Job must be analyzed before generating tailored resume');
    }

    // Get user profile data
    const [workExperience, skills, education] = await Promise.all([
      database!.getAllWorkExperience(),
      database!.getAllSkills(),
      database!.getAllEducation()
    ]);

    // Query relevant chunks
    const relevantChunks = await ragService.queryRelevantChunks(job.analysis_data, 10);
    
    // Generate tailored resume
    return await ragService.generateTailoredResume(job, relevantChunks);
  });

  ipcMain.handle('rag:preview-resume', async (_, _jobId, tailoredContent) => {
    if (!ragService) {
      throw new Error('RAG service not initialized');
    }

    // This would typically involve more sophisticated preview generation
    // For now, we'll create a simple preview
    return await ragService.generateResumePreview('Original resume content', tailoredContent);
  });

  ipcMain.handle('rag:save-tailored-content', async (_, applicationId, content) => {
    const application = await database!.getApplicationsByJob(applicationId);
    if (application.length === 0) {
      throw new Error('Application not found');
    }

    const updatedApplication = { ...application[0], tailored_content: content };
    await database!.saveApplication(updatedApplication);
  });

  ipcMain.handle('rag:reindex-profile', async () => {
    if (!ragService) {
      throw new Error('RAG service not initialized');
    }

    // Get all user profile data and reindex
    await ragService.reindexProfile(
      await database!.getAllWorkExperience(),
      await database!.getAllSkills(),
      await database!.getAllEducation()
    );
  });

  ipcMain.handle('rag:clear-embeddings', async () => {
    if (!ragService) {
      throw new Error('RAG service not initialized');
    }

    await ragService.clearEmbeddings();
  });

  // PDF Generation handlers
  ipcMain.handle('pdf:get-templates', async () => {
    if (!pdfService) {
      throw new Error('PDF service not initialized');
    }
    return pdfService.getTemplates();
  });

  ipcMain.handle('pdf:generate-resume', async (_, applicationId, settings) => {
    if (!pdfService) {
      throw new Error('PDF service not initialized');
    }

    // Get application data
    const applications = await database!.getApplicationsByJob(applicationId);
    if (applications.length === 0) {
      throw new Error('Application not found');
    }

    const application = applications[0];
    const job = await database!.getJobById(application.job_id);
    if (!job) {
      throw new Error('Job not found');
    }

    // Get all profile data
    const [personalInfo, workExperience, education, skills, certifications] = await Promise.all([
      database!.getPersonalInfo(),
      database!.getAllWorkExperience(),
      database!.getAllEducation(),
      database!.getAllSkills(),
      database!.getAllCertifications()
    ]);

    if (!personalInfo) {
      throw new Error('Personal information not found. Please complete your profile.');
    }

    if (!application.tailored_content) {
      throw new Error('Tailored content not found. Please generate tailored resume first.');
    }

    // Prepare resume data
    const resumeData = {
      personalInfo,
      tailoredContent: application.tailored_content,
      workExperience,
      education,
      skills,
      certifications,
      jobInfo: {
        company: job.company,
        position: job.position,
        jobAnalysis: job.analysis_data
      }
    };

    // Generate PDF
    const filePath = await pdfService.generateResume(resumeData, settings);
    
    // Update application with PDF path
    const updatedApplication = { ...application, tailored_resume_path: filePath };
    await database!.saveApplication(updatedApplication);
    
    return filePath;
  });

  ipcMain.handle('pdf:get-settings', async () => {
    return aiService!.getModel(); // Using AI service store for now
  });

  ipcMain.handle('pdf:save-settings', async (_event, _settings) => {
    // Save PDF settings to store
    // Implementation depends on your storage preference
  });

  ipcMain.handle('pdf:open-resume', async (_, filePath) => {
    try {
      await shell.openPath(filePath);
    } catch (error) {
      console.error('Failed to open PDF:', error);
      throw error;
    }
  });

  // Browser Automation handlers
  ipcMain.handle('automation:detect-job-page', async (_, jobId) => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }

    const job = await database!.getJobById(jobId);
    if (!job || !job.job_url) {
      throw new Error('Job not found or no URL provided');
    }

    try {
      const result = await automationService.detectJobPage(job.job_url, job.position);
      
      // Save automation log
      const log = {
        job_id: jobId,
        action: 'detect' as const,
        status: result.success ? 'success' as const : 'failed' as const,
        details: result,
        screenshot_path: result.screenshotPath
      };
      
      await database!.saveAutomationLog(log);
      
      return result;
    } catch (error) {
      console.error('Job page detection failed:', error);
      
      // Save error log
      const log = {
        job_id: jobId,
        action: 'detect' as const,
        status: 'error' as const,
        details: {
          success: false,
          applyButtonFound: false,
          formFields: [],
          pageTitle: '',
          pageUrl: '',
          errors: [(error as Error).message || error?.toString() || 'Unknown error'],
          warnings: []
        }
      };
      
      await database!.saveAutomationLog(log);
      throw error;
    }
  });

  ipcMain.handle('automation:get-settings', async () => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }
    return automationService.getSettings();
  });

  ipcMain.handle('automation:save-settings', async (_, settings) => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }
    await automationService.updateSettings(settings);
  });

  ipcMain.handle('automation:get-logs', async (_, jobId) => {
    return await database!.getAutomationLogsByJob(jobId);
  });

  ipcMain.handle('automation:save-log', async (_, log) => {
    return await database!.saveAutomationLog(log);
  });

  // Form Auto-Fill handlers
  ipcMain.handle('automation:auto-fill-form', async (_, jobId, applicationId) => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }

    const job = await database!.getJobById(jobId);
    if (!job || !job.job_url) {
      throw new Error('Job not found or no URL provided');
    }

    const personalInfo = await database!.getPersonalInfo();
    if (!personalInfo) {
      throw new Error('Personal information not found. Please complete your profile.');
    }

    // Get tailored resume path if application exists
    let tailoredResumePath: string | undefined;
    if (applicationId) {
      const applications = await database!.getApplicationsByJob(applicationId);
      if (applications.length > 0 && applications[0].tailored_resume_path) {
        tailoredResumePath = applications[0].tailored_resume_path;
      }
    }

    try {
      const result = await automationService.autoFillForm(job.job_url, personalInfo, tailoredResumePath);
      
      // Save automation log
      const log = {
        job_id: jobId,
        application_id: applicationId,
        action: 'fill_form' as const,
        status: result.success ? 'success' as const : 'failed' as const,
        details: {
          success: result.success,
          applyButtonFound: true,
          formFields: result.filledFields.map(f => f.detectedField),
          pageTitle: '',
          pageUrl: job.job_url,
          errors: result.errors,
          warnings: result.warnings
        },
        screenshot_path: result.screenshots[result.screenshots.length - 1]
      };
      
      await database!.saveAutomationLog(log);
      
      return result;
    } catch (error) {
      console.error('Auto-fill failed:', error);
      
      // Save error log
      const log = {
        job_id: jobId,
        application_id: applicationId,
        action: 'fill_form' as const,
        status: 'error' as const,
        details: {
          success: false,
          applyButtonFound: false,
          formFields: [],
          pageTitle: '',
          pageUrl: job.job_url,
          errors: [(error as Error).message || 'Unknown error'],
          warnings: []
        }
      };
      
      await database!.saveAutomationLog(log);
      throw error;
    }
  });

  ipcMain.handle('automation:submit-application', async (_, jobId, applicationId, confirmData) => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }

    const job = await database!.getJobById(jobId);
    if (!job || !job.job_url) {
      throw new Error('Job not found or no URL provided');
    }

    try {
      // For now, we'll use a simple submit approach
      // In a real implementation, you'd need to navigate to the form and find the submit button
      const submission = {
        job_id: jobId,
        filledData: confirmData,
        screenshots: [],
        submittedAt: new Date().toISOString(),
        finalUrl: job.job_url,
        success: true
      };
      
      // Update job status to applied
      const updatedJob = { ...job, status: 'applied' as const };
      await database!.saveJob(updatedJob);
      
      // Update application if it exists
      if (applicationId) {
        const applications = await database!.getApplicationsByJob(applicationId);
        if (applications.length > 0) {
          const updatedApplication = { 
            ...applications[0], 
            status: 'applied' as const,
            applied_date: submission.submittedAt
          };
          await database!.saveApplication(updatedApplication);
        }
      }
      
      // Save submission log
      const log = {
        job_id: jobId,
        application_id: applicationId,
        action: 'submit' as const,
        status: 'success' as const,
        details: {
          success: submission.success,
          applyButtonFound: true,
          formFields: confirmData.map((f: FieldMapping) => f.detectedField),
          pageTitle: '',
          pageUrl: submission.finalUrl,
          errors: [],
          warnings: []
        },
        screenshot_path: ''
      };
      
      await database!.saveAutomationLog(log);
      
      return submission;
    } catch (error) {
      console.error('Application submission failed:', error);
      throw error;
    }
  });

  ipcMain.handle('automation:get-filled-data', async (_, jobId) => {
    const logs = await database!.getAutomationLogsByJob(jobId);
    const fillLog = logs.find(log => log.action === 'fill_form' && log.status === 'success');
    
    if (!fillLog || !fillLog.details) {
      return [];
    }

    const fillResult = fillLog.details as any;
    return fillResult.filledFields || [];
  });

  // CAPTCHA Detection & Manual Assist handlers
  ipcMain.handle('automation:detect-captcha', async (_, jobId) => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }

    const job = await database!.getJobById(jobId);
    if (!job || !job.job_url) {
      throw new Error('Job not found or no URL provided');
    }

    try {
      const detection = await automationService.detectCaptcha(job.job_url);
      
      // Save automation log
      const log = {
        job_id: jobId,
        action: 'detect' as const,
        status: detection.detected ? 'success' as const : 'success' as const,
        details: {
          success: detection.detected,
          applyButtonFound: false,
          formFields: [],
          pageTitle: '',
          pageUrl: detection.pageUrl,
          errors: [],
          warnings: []
        },
        screenshot_path: detection.screenshotPath
      };
      
      await database!.saveAutomationLog(log);
      
      return detection;
    } catch (error) {
      console.error('CAPTCHA detection failed:', error);
      throw error;
    }
  });

  ipcMain.handle('automation:analyze-form-vision', async (_, screenshotPath) => {
    if (!visionAIService) {
      throw new Error('Vision AI service not initialized');
    }

    const personalInfo = await database!.getPersonalInfo();
    if (!personalInfo) {
      throw new Error('Personal information not found. Please complete your profile.');
    }

    try {
      const analysis = await visionAIService.analyzeFormScreenshot(screenshotPath, personalInfo);
      return analysis;
    } catch (error) {
      console.error('Vision analysis failed:', error);
      throw error;
    }
  });

  ipcMain.handle('automation:create-manual-assist-session', async (_, jobId, applicationId) => {
    const session = {
      job_id: jobId,
      application_id: applicationId,
      captcha_detected: false,
      status: 'pending' as const
    };

    return await database!.saveManualAssistSession(session);
  });

  ipcMain.handle('automation:update-manual-assist-session', async (_, session) => {
    return await database!.saveManualAssistSession(session);
  });

  ipcMain.handle('automation:get-manual-assist-sessions', async (_, jobId) => {
    return await database!.getManualAssistSessionsByJob(jobId);
  });

  ipcMain.handle('automation:open-external-browser', async (_, url) => {
    if (!automationService) {
      throw new Error('Automation service not initialized');
    }

    try {
      await automationService.openExternalBrowser(url);
    } catch (error) {
      console.error('Failed to open external browser:', error);
      throw error;
    }
  });

  // Job Board Profiles handlers
  ipcMain.handle('job-boards:get-profiles', async () => {
    if (!jobBoardService) {
      throw new Error('Job board service not initialized');
    }
    return jobBoardService.getAllProfiles();
  });

  ipcMain.handle('job-boards:save-profile', async (_, profile) => {
    if (!jobBoardService) {
      throw new Error('Job board service not initialized');
    }
    jobBoardService.saveProfile(profile);
  });

  ipcMain.handle('job-boards:detect-board', async (_, url) => {
    if (!jobBoardService) {
      throw new Error('Job board service not initialized');
    }
    return jobBoardService.detectJobBoard(url);
  });

  ipcMain.handle('job-boards:get-profile', async (_, boardId) => {
    if (!jobBoardService) {
      throw new Error('Job board service not initialized');
    }
    return jobBoardService.getProfile(boardId);
  });

  // Batch Processing handlers
  ipcMain.handle('batch:start-session', async (_, jobIds, settings) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    return await batchProcessingService.startSession(jobIds, settings);
  });

  ipcMain.handle('batch:get-session', async (_, sessionId) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    return batchProcessingService.getSession(sessionId);
  });

  ipcMain.handle('batch:get-progress', async (_, sessionId) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    return batchProcessingService.getProgress(sessionId);
  });

  ipcMain.handle('batch:pause-session', async (_, sessionId) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    batchProcessingService.pauseSession(sessionId);
  });

  ipcMain.handle('batch:resume-session', async (_, sessionId) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    batchProcessingService.resumeSession(sessionId);
  });

  ipcMain.handle('batch:stop-session', async (_, sessionId) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    batchProcessingService.stopSession(sessionId);
  });

  ipcMain.handle('batch:get-results', async (_, sessionId) => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    return batchProcessingService.getResults(sessionId);
  });

  ipcMain.handle('batch:get-sessions', async () => {
    if (!batchProcessingService) {
      throw new Error('Batch processing service not initialized');
    }
    return batchProcessingService.getAllSessions();
  });

  // Analytics handlers
  ipcMain.handle('analytics:get-data', async (_, days) => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }
    return await analyticsService.getAnalyticsData(days);
  });

  ipcMain.handle('analytics:export-data', async () => {
    if (!analyticsService) {
      throw new Error('Analytics service not initialized');
    }
    return await analyticsService.exportAnalyticsData();
  });

  // Export/Import handlers
  ipcMain.handle('export:all-data', async () => {
    if (!database) {
      throw new Error('Database not initialized');
    }
    return await database.exportAllData();
  });

  ipcMain.handle('import:all-data', async (_, data) => {
    if (!database) {
      throw new Error('Database not initialized');
    }
    return await database.importAllData(data);
  });

  ipcMain.handle('export:applications-csv', async () => {
    if (!database) {
      throw new Error('Database not initialized');
    }
    return await database.exportApplicationsCSV();
  });

  ipcMain.handle('export:resume-pdf', async (_, settings) => {
    if (!pdfService) {
      throw new Error('PDF service not initialized');
    }
    // Get profile data first
    const [personalInfo, workExperience, education, skills, certifications] = await Promise.all([
      database!.getPersonalInfo(),
      database!.getAllWorkExperience(),
      database!.getAllEducation(),
      database!.getAllSkills(),
      database!.getAllCertifications()
    ]);

    if (!personalInfo) {
      throw new Error('Personal information not found. Please complete your profile.');
    }

    // Prepare resume data
    const resumeData = {
      personalInfo,
      tailoredContent: {
        selected_experiences: [],
        rewritten_achievements: [],
        skills_to_highlight: [],
        custom_summary: '',
        generated_at: new Date().toISOString()
      },
      workExperience,
      education,
      skills,
      certifications,
      jobInfo: {
        company: "Export",
        position: "Generic Resume",
        jobAnalysis: undefined
      }
    };

    return await pdfService.generateResume(resumeData, settings);
  });

  // Error Logging handlers
  ipcMain.handle('errors:get-logs', async (_, limit, level) => {
    if (!errorLoggingService) {
      throw new Error('Error logging service not initialized');
    }
    return await errorLoggingService.getLogs(limit, level);
  });

  ipcMain.handle('errors:clear-logs', async () => {
    if (!errorLoggingService) {
      throw new Error('Error logging service not initialized');
    }
    return await errorLoggingService.clearLogs();
  });

  ipcMain.handle('errors:export-logs', async () => {
    if (!errorLoggingService) {
      throw new Error('Error logging service not initialized');
    }
    return await errorLoggingService.exportLogs();
  });

  ipcMain.handle('errors:get-stats', async () => {
    if (!errorLoggingService) {
      throw new Error('Error logging service not initialized');
    }
    return await errorLoggingService.getErrorStats();
  });
}
