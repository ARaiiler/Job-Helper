import { contextBridge, ipcRenderer } from 'electron';
import { IPCChannels } from '../shared/types';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Personal Info
  getPersonalInfo: () => ipcRenderer.invoke('personal-info:get'),
  savePersonalInfo: (data: any) => ipcRenderer.invoke('personal-info:save', data),
  
  // Work Experience
  getAllWorkExperience: () => ipcRenderer.invoke('work-experience:get-all'),
  saveWorkExperience: (data: any) => ipcRenderer.invoke('work-experience:save', data),
  deleteWorkExperience: (id: number) => ipcRenderer.invoke('work-experience:delete', id),
  
  // Education
  getAllEducation: () => ipcRenderer.invoke('education:get-all'),
  saveEducation: (data: any) => ipcRenderer.invoke('education:save', data),
  deleteEducation: (id: number) => ipcRenderer.invoke('education:delete', id),
  
  // Skills
  getAllSkills: () => ipcRenderer.invoke('skills:get-all'),
  saveSkill: (data: any) => ipcRenderer.invoke('skills:save', data),
  deleteSkill: (id: number) => ipcRenderer.invoke('skills:delete', id),
  
  // Certifications
  getAllCertifications: () => ipcRenderer.invoke('certifications:get-all'),
  saveCertification: (data: any) => ipcRenderer.invoke('certifications:save', data),
  deleteCertification: (id: number) => ipcRenderer.invoke('certifications:delete', id),
  
  // Jobs
  getAllJobs: () => ipcRenderer.invoke('jobs:get-all'),
  getJobById: (id: number) => ipcRenderer.invoke('jobs:get-by-id', id),
  saveJob: (data: any) => ipcRenderer.invoke('jobs:save', data),
  deleteJob: (id: number) => ipcRenderer.invoke('jobs:delete', id),
  getJobStats: () => ipcRenderer.invoke('jobs:get-stats'),
  getRecentActivity: () => ipcRenderer.invoke('jobs:get-recent-activity'),
  
  // Applications
  getApplicationsByJob: (jobId: number) => ipcRenderer.invoke('applications:get-by-job', jobId),
  saveApplication: (data: any) => ipcRenderer.invoke('applications:save', data),
  deleteApplication: (id: number) => ipcRenderer.invoke('applications:delete', id),
  
  // AI Analysis
  analyzeJob: (jobId: number) => ipcRenderer.invoke('ai:analyze-job', jobId),
  calculateMatch: (jobId: number) => ipcRenderer.invoke('ai:calculate-match', jobId),
  testAIConnection: () => ipcRenderer.invoke('ai:test-connection'),
  
  // Settings
  getApiKey: () => ipcRenderer.invoke('settings:get-api-key'),
  saveApiKey: (key: string) => ipcRenderer.invoke('settings:save-api-key', key),
  getModel: () => ipcRenderer.invoke('settings:get-model'),
  saveModel: (model: string) => ipcRenderer.invoke('settings:save-model', model),
  
  // RAG System
  generateTailoredResume: (jobId: number) => ipcRenderer.invoke('rag:generate-tailored-resume', jobId),
  previewResume: (jobId: number, tailoredContent: any) => ipcRenderer.invoke('rag:preview-resume', jobId, tailoredContent),
  saveTailoredContent: (applicationId: number, content: any) => ipcRenderer.invoke('rag:save-tailored-content', applicationId, content),
  reindexProfile: () => ipcRenderer.invoke('rag:reindex-profile'),
  clearEmbeddings: () => ipcRenderer.invoke('rag:clear-embeddings'),
  
  // PDF Generation
  getTemplates: () => ipcRenderer.invoke('pdf:get-templates'),
  generateResume: (applicationId: number, settings: any) => ipcRenderer.invoke('pdf:generate-resume', applicationId, settings),
  getPDFSettings: () => ipcRenderer.invoke('pdf:get-settings'),
  savePDFSettings: (settings: any) => ipcRenderer.invoke('pdf:save-settings', settings),
  openResume: (filePath: string) => ipcRenderer.invoke('pdf:open-resume', filePath),
  
  // Browser Automation
  detectJobPage: (jobId: number) => ipcRenderer.invoke('automation:detect-job-page', jobId),
  getAutomationSettings: () => ipcRenderer.invoke('automation:get-settings'),
  saveAutomationSettings: (settings: any) => ipcRenderer.invoke('automation:save-settings', settings),
  getAutomationLogs: (jobId: number) => ipcRenderer.invoke('automation:get-logs', jobId),
  saveAutomationLog: (log: any) => ipcRenderer.invoke('automation:save-log', log),
  
  // Form Auto-Fill
  autoFillForm: (jobId: number, applicationId?: number) => ipcRenderer.invoke('automation:auto-fill-form', jobId, applicationId),
  submitApplication: (jobId: number, applicationId: number, confirmData: any) => ipcRenderer.invoke('automation:submit-application', jobId, applicationId, confirmData),
  getFilledData: (jobId: number) => ipcRenderer.invoke('automation:get-filled-data', jobId),
  
  // CAPTCHA Detection & Manual Assist
  detectCaptcha: (jobId: number) => ipcRenderer.invoke('automation:detect-captcha', jobId),
  analyzeFormVision: (screenshotPath: string) => ipcRenderer.invoke('automation:analyze-form-vision', screenshotPath),
  createManualAssistSession: (jobId: number, applicationId?: number) => ipcRenderer.invoke('automation:create-manual-assist-session', jobId, applicationId),
  updateManualAssistSession: (session: any) => ipcRenderer.invoke('automation:update-manual-assist-session', session),
  getManualAssistSessions: (jobId: number) => ipcRenderer.invoke('automation:get-manual-assist-sessions', jobId),
  openExternalBrowser: (url: string) => ipcRenderer.invoke('automation:open-external-browser', url),
  
  // Job Board Profiles
  getJobBoardProfiles: () => ipcRenderer.invoke('job-boards:get-profiles'),
  saveJobBoardProfile: (profile: any) => ipcRenderer.invoke('job-boards:save-profile', profile),
  detectJobBoard: (url: string) => ipcRenderer.invoke('job-boards:detect-board', url),
  getJobBoardProfile: (boardId: string) => ipcRenderer.invoke('job-boards:get-profile', boardId),
  
  // Batch Processing
  startBatchSession: (jobIds: number[], settings: any) => ipcRenderer.invoke('batch:start-session', jobIds, settings),
  getBatchSession: (sessionId: string) => ipcRenderer.invoke('batch:get-session', sessionId),
  getBatchProgress: (sessionId: string) => ipcRenderer.invoke('batch:get-progress', sessionId),
  pauseBatchSession: (sessionId: string) => ipcRenderer.invoke('batch:pause-session', sessionId),
  resumeBatchSession: (sessionId: string) => ipcRenderer.invoke('batch:resume-session', sessionId),
  stopBatchSession: (sessionId: string) => ipcRenderer.invoke('batch:stop-session', sessionId),
  getBatchResults: (sessionId: string) => ipcRenderer.invoke('batch:get-results', sessionId),
  getBatchSessions: () => ipcRenderer.invoke('batch:get-sessions'),
  
  // Analytics
  getAnalyticsData: (days?: number) => ipcRenderer.invoke('analytics:get-data', days),
  exportAnalytics: () => ipcRenderer.invoke('analytics:export-data'),
  
  // Export/Import
  exportAllData: () => ipcRenderer.invoke('export:all-data'),
  importAllData: (data: any) => ipcRenderer.invoke('import:all-data', data),
  exportApplicationsCSV: () => ipcRenderer.invoke('export:applications-csv'),
  exportResumePDF: (settings: any) => ipcRenderer.invoke('export:resume-pdf', settings),
  
  // Error Logging
  getErrorLogs: (limit?: number, level?: string) => ipcRenderer.invoke('errors:get-logs', limit, level),
  clearErrorLogs: () => ipcRenderer.invoke('errors:clear-logs'),
  exportErrorLogs: () => ipcRenderer.invoke('errors:export-logs'),
  getErrorStats: () => ipcRenderer.invoke('errors:get-stats'),
});

// Type declaration for the global window object
declare global {
  interface Window {
    electronAPI: typeof import('./preload');
  }
}
