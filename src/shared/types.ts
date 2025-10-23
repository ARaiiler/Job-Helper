// Personal Info Types
export interface PersonalInfo {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  created_at?: string;
  updated_at?: string;
}

// Work Experience Types
export interface WorkExperience {
  id?: number;
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  description?: string;
  achievements: string[]; // JSON array of achievements
  created_at?: string;
  updated_at?: string;
}

// Education Types
export interface Education {
  id?: number;
  institution: string;
  degree: string;
  field?: string;
  start_date: string;
  end_date?: string;
  gpa?: number;
  created_at?: string;
  updated_at?: string;
}

// Skills Types
export type SkillCategory = 'technical' | 'soft' | 'languages';

export interface Skill {
  id?: number;
  name: string;
  category: SkillCategory;
  proficiency_level: number; // 1-5 scale
  created_at?: string;
  updated_at?: string;
}

// Certifications Types
export interface Certification {
  id?: number;
  name: string;
  issuer: string;
  date: string;
  credential_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Job Tracking Types
export type JobStatus = 'queued' | 'applied' | 'interviewing' | 'rejected' | 'offer';
export type ApplicationStatus = 'applied' | 'interviewing' | 'rejected' | 'offer';

export interface Job {
  id?: number;
  company: string;
  position: string;
  job_url?: string;
  description?: string;
  date_added?: string;
  status: JobStatus;
  notes?: string;
  analysis_data?: JobAnalysis;
  match_score?: number;
  analyzed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// AI Analysis Types
export interface JobAnalysis {
  required_skills: string[];
  preferred_skills: string[];
  experience_level: string;
  key_responsibilities: string[];
  ats_keywords: string[];
  analysis_timestamp: string;
}

export interface ProfileMatch {
  overall_score: number;
  skills_match: number;
  experience_match: number;
  keyword_match: number;
  missing_skills: string[];
  matched_skills: string[];
}

// RAG System Types
export interface ProfileChunk {
  id: string;
  content: string;
  type: 'work_achievement' | 'skill' | 'education' | 'project';
  metadata: {
    source_id: number;
    date: string;
    relevance_score?: number;
  };
}

export interface TailoredContent {
  selected_experiences: {
    id: number;
    original: string;
    tailored: string;
  }[];
  rewritten_achievements: {
    id: number;
    original: string;
    tailored: string;
  }[];
  skills_to_highlight: string[];
  custom_summary: string;
  generated_at: string;
}

export interface ResumePreview {
  original: string;
  tailored: string;
  changes: {
    type: 'added' | 'modified' | 'removed';
    content: string;
  }[];
}

// PDF Generation Types
export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'ats' | 'creative';
  preview: string; // Base64 preview image
}

export interface PDFSettings {
  template: string;
  font: 'serif' | 'sans-serif';
  colorScheme: 'professional' | 'blue' | 'green' | 'purple';
  fontSize: 'small' | 'medium' | 'large';
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  tailoredContent: TailoredContent;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  jobInfo: {
    company: string;
    position: string;
    jobAnalysis?: JobAnalysis;
  };
}

// Browser Automation Types
export interface AutomationSettings {
  headless: boolean;
  timeout: number; // milliseconds
  screenshotDirectory: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
}

export interface FormField {
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'file' | 'checkbox' | 'radio';
  name: string;
  id?: string;
  placeholder?: string;
  label?: string;
  required: boolean;
  selector: string;
  value?: string;
}

export interface DetectionResult {
  success: boolean;
  applyButtonFound: boolean;
  applyButtonSelector?: string;
  formFields: FormField[];
  pageTitle: string;
  pageUrl: string;
  screenshotPath?: string;
  errors: string[];
  warnings: string[];
}

export interface AutomationLog {
  id?: number;
  job_id: number;
  application_id?: number;
  action: 'detect' | 'apply' | 'fill_form' | 'upload_resume' | 'submit';
  status: 'success' | 'failed' | 'timeout' | 'error';
  details?: DetectionResult;
  screenshot_path?: string;
  created_at?: string;
}

// Field Mapping Types
export interface FieldMapping {
  detectedField: FormField;
  profileField: string;
  value: string;
  confidence: number; // 0-1, how confident we are in this mapping
}

export interface FillResult {
  success: boolean;
  filledFields: FieldMapping[];
  unfilledFields: FormField[];
  errors: string[];
  warnings: string[];
  screenshots: string[];
  finalPageUrl?: string;
}

export interface ApplicationSubmission {
  job_id: number;
  application_id?: number;
  filledData: FieldMapping[];
  screenshots: string[];
  submittedAt: string;
  finalUrl: string;
  success: boolean;
}

// CAPTCHA Detection Types
export interface CaptchaDetection {
  detected: boolean;
  type: 'recaptcha' | 'hcaptcha' | 'cloudflare' | 'turnstile' | 'unknown';
  confidence: number;
  indicators: string[];
  screenshotPath?: string;
  pageUrl: string;
  detectedAt: string;
}

export interface VisionAnalysis {
  fields: VisionField[];
  confidence: number;
  analysisTime: string;
  model: string;
}

export interface VisionField {
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'file' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  value?: string; // Pre-filled value from profile
  confidence: number;
}

export interface ManualAssistSession {
  id?: number;
  job_id: number;
  application_id?: number;
  captcha_detected: boolean;
  captcha_type?: string;
  screenshot_path?: string;
  form_url?: string;
  vision_analysis?: VisionAnalysis;
  prefill_data?: string; // JSON string of pre-filled data
  status: 'pending' | 'completed' | 'failed' | 'manual_completed';
  created_at?: string;
  completed_at?: string;
}

// Job Board Profile Types
export interface JobBoardProfile {
  id: string;
  name: string;
  domain: string; // Regex pattern for URL matching
  enabled: boolean;
  captcha_likelihood: 'low' | 'medium' | 'high';
  navigation_flow: 'single_page' | 'multi_step' | 'modal';
  custom_selectors: JobBoardSelectors;
  quirks: string[];
  rate_limit: {
    max_per_hour: number;
    max_per_day: number;
    min_delay: number; // seconds
    max_delay: number; // seconds
  };
}

export interface JobBoardSelectors {
  apply_button: string[];
  form_container: string[];
  fields: {
    first_name: string[];
    last_name: string[];
    email: string[];
    phone: string[];
    location: string[];
    linkedin: string[];
    portfolio: string[];
    resume_upload: string[];
    cover_letter: string[];
  };
  navigation: {
    next_button: string[];
    submit_button: string[];
    back_button: string[];
  };
  captcha: {
    indicators: string[];
    iframe_selectors: string[];
  };
}

// Batch Processing Types
export interface BatchSettings {
  max_applications: number;
  delay_min: number; // seconds
  delay_max: number; // seconds
  auto_submit: boolean;
  stop_on_error: boolean;
  retry_attempts: number;
  dry_run: boolean;
  enabled_boards: string[]; // Job board IDs to process
}

export interface BatchJob {
  id: number;
  job_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  attempts: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  processing_time?: number; // seconds
}

export interface BatchSession {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'stopped' | 'failed';
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  skipped_jobs: number;
  current_job_id?: number;
  started_at?: string;
  completed_at?: string;
  settings: BatchSettings;
  results: BatchResults;
}

export interface BatchResults {
  success_rate: number;
  average_time_per_job: number;
  total_time: number;
  common_failures: string[];
  job_board_breakdown: {
    [boardId: string]: {
      total: number;
      successful: number;
      failed: number;
      average_time: number;
    };
  };
}

export interface BatchProgress {
  session_id: string;
  current_job: Job | null;
  progress_percentage: number;
  estimated_remaining_time: number;
  logs: BatchLog[];
}

export interface BatchLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  job_id?: number;
  details?: any;
}

export interface Application {
  id?: number;
  job_id: number;
  applied_date?: string;
  tailored_resume_path?: string;
  tailored_content?: TailoredContent;
  status: ApplicationStatus;
  created_at?: string;
  updated_at?: string;
}

// Job Statistics Types
export interface JobStats {
  total: number;
  queued: number;
  applied: number;
  interviewing: number;
  rejected: number;
  offers: number;
}

export interface RecentActivity {
  id: number;
  type: 'job_added' | 'job_updated' | 'application_submitted' | 'status_changed';
  description: string;
  timestamp: string;
  job_id?: number;
}

// IPC Channel Types
export interface IPCChannels {
  // Personal Info
  'personal-info:get': () => Promise<PersonalInfo | null>;
  'personal-info:save': (data: PersonalInfo) => Promise<PersonalInfo>;
  
  // Work Experience
  'work-experience:get-all': () => Promise<WorkExperience[]>;
  'work-experience:save': (data: WorkExperience) => Promise<WorkExperience>;
  'work-experience:delete': (id: number) => Promise<void>;
  
  // Education
  'education:get-all': () => Promise<Education[]>;
  'education:save': (data: Education) => Promise<Education>;
  'education:delete': (id: number) => Promise<void>;
  
  // Skills
  'skills:get-all': () => Promise<Skill[]>;
  'skills:save': (data: Skill) => Promise<Skill>;
  'skills:delete': (id: number) => Promise<void>;
  
  // Certifications
  'certifications:get-all': () => Promise<Certification[]>;
  'certifications:save': (data: Certification) => Promise<Certification>;
  'certifications:delete': (id: number) => Promise<void>;
  
  // Jobs
  'jobs:get-all': () => Promise<Job[]>;
  'jobs:get-by-id': (id: number) => Promise<Job | null>;
  'jobs:save': (data: Job) => Promise<Job>;
  'jobs:delete': (id: number) => Promise<void>;
  'jobs:get-stats': () => Promise<JobStats>;
  'jobs:get-recent-activity': () => Promise<RecentActivity[]>;
  
  // Applications
  'applications:get-by-job': (jobId: number) => Promise<Application[]>;
  'applications:save': (data: Application) => Promise<Application>;
  'applications:delete': (id: number) => Promise<void>;
  
  // AI Analysis
  'ai:analyze-job': (jobId: number) => Promise<JobAnalysis>;
  'ai:calculate-match': (jobId: number) => Promise<ProfileMatch>;
  'ai:test-connection': () => Promise<boolean>;
  
  // Settings
  'settings:get-api-key': () => Promise<string | null>;
  'settings:save-api-key': (key: string) => Promise<void>;
  'settings:get-model': () => Promise<string>;
  'settings:save-model': (model: string) => Promise<void>;
  
  // RAG System
  'rag:generate-tailored-resume': (jobId: number) => Promise<TailoredContent>;
  'rag:preview-resume': (jobId: number, tailoredContent: TailoredContent) => Promise<ResumePreview>;
  'rag:save-tailored-content': (applicationId: number, content: TailoredContent) => Promise<void>;
  'rag:reindex-profile': () => Promise<void>;
  'rag:clear-embeddings': () => Promise<void>;
  
  // PDF Generation
  'pdf:get-templates': () => Promise<ResumeTemplate[]>;
  'pdf:generate-resume': (applicationId: number, settings: PDFSettings) => Promise<string>;
  'pdf:get-settings': () => Promise<PDFSettings>;
  'pdf:save-settings': (settings: PDFSettings) => Promise<void>;
  'pdf:open-resume': (filePath: string) => Promise<void>;
  
  // Browser Automation
  'automation:detect-job-page': (jobId: number) => Promise<DetectionResult>;
  'automation:get-settings': () => Promise<AutomationSettings>;
  'automation:save-settings': (settings: AutomationSettings) => Promise<void>;
  'automation:get-logs': (jobId: number) => Promise<AutomationLog[]>;
  'automation:save-log': (log: AutomationLog) => Promise<void>;
  
  // Form Auto-Fill
  'automation:auto-fill-form': (jobId: number, applicationId?: number) => Promise<FillResult>;
  'automation:submit-application': (jobId: number, applicationId: number, confirmData: FieldMapping[]) => Promise<ApplicationSubmission>;
  'automation:get-filled-data': (jobId: number) => Promise<FieldMapping[]>;
  
  // CAPTCHA Detection & Manual Assist
  'automation:detect-captcha': (jobId: number) => Promise<CaptchaDetection>;
  'automation:analyze-form-vision': (screenshotPath: string) => Promise<VisionAnalysis>;
  'automation:create-manual-assist-session': (jobId: number, applicationId?: number) => Promise<ManualAssistSession>;
  'automation:update-manual-assist-session': (session: ManualAssistSession) => Promise<ManualAssistSession>;
  'automation:get-manual-assist-sessions': (jobId: number) => Promise<ManualAssistSession[]>;
  'automation:open-external-browser': (url: string) => Promise<void>;
  
  // Job Board Profiles
  'job-boards:get-profiles': () => Promise<JobBoardProfile[]>;
  'job-boards:save-profile': (profile: JobBoardProfile) => Promise<void>;
  'job-boards:detect-board': (url: string) => Promise<JobBoardProfile | null>;
  'job-boards:get-profile': (boardId: string) => Promise<JobBoardProfile>;
  
  // Batch Processing
  'batch:start-session': (jobIds: number[], settings: BatchSettings) => Promise<string>;
  'batch:get-session': (sessionId: string) => Promise<BatchSession>;
  'batch:get-progress': (sessionId: string) => Promise<BatchProgress>;
  'batch:pause-session': (sessionId: string) => Promise<void>;
  'batch:resume-session': (sessionId: string) => Promise<void>;
  'batch:stop-session': (sessionId: string) => Promise<void>;
  'batch:get-results': (sessionId: string) => Promise<BatchResults>;
  'batch:get-sessions': () => Promise<BatchSession[]>;
}

// Form Validation Types
export interface FormErrors {
  [key: string]: string | undefined;
}

// UI State Types
export interface TabState {
  activeTab: string;
}

export interface LoadingState {
  [key: string]: boolean;
}
