-- User Profile Tables
CREATE TABLE IF NOT EXISTS personal_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    location TEXT,
    linkedin TEXT,
    portfolio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_experience (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    achievements TEXT, -- JSON array of achievements
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    gpa REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('technical', 'soft', 'languages')),
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    date DATE NOT NULL,
    credential_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Job Tracking Tables
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    job_url TEXT,
    description TEXT,
    date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'applied', 'interviewing', 'rejected', 'offer')),
    notes TEXT,
    -- AI Analysis columns
    analysis_data TEXT, -- JSON containing AI analysis results
    match_score REAL, -- Profile match percentage (0-100)
    analyzed_at DATETIME, -- When analysis was performed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    tailored_resume_path TEXT,
    tailored_content TEXT, -- JSON containing tailored resume content
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'rejected', 'offer')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

-- Automation Logs
CREATE TABLE IF NOT EXISTS automation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    application_id INTEGER,
    action TEXT NOT NULL, -- 'detect', 'apply', 'fill_form', 'upload_resume'
    status TEXT NOT NULL, -- 'success', 'failed', 'timeout', 'error'
    details TEXT, -- JSON containing detection results, errors, etc.
    screenshot_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
);

-- Manual Assist Sessions Table
CREATE TABLE IF NOT EXISTS manual_assist_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    application_id INTEGER,
    captcha_detected BOOLEAN NOT NULL DEFAULT 0,
    captcha_type TEXT,
    screenshot_path TEXT,
    form_url TEXT,
    vision_analysis TEXT, -- JSON containing VisionAnalysis
    prefill_data TEXT, -- JSON containing pre-filled form data
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'manual_completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE
);

-- Job Board Profiles Table
CREATE TABLE IF NOT EXISTS job_board_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL, -- Regex pattern for URL matching
    enabled BOOLEAN NOT NULL DEFAULT 1,
    captcha_likelihood TEXT NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high'
    navigation_flow TEXT NOT NULL DEFAULT 'single_page', -- 'single_page', 'multi_step', 'modal'
    custom_selectors TEXT NOT NULL, -- JSON containing JobBoardSelectors
    quirks TEXT, -- JSON array of strings
    rate_limit TEXT NOT NULL, -- JSON containing rate limit settings
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Batch Sessions Table
CREATE TABLE IF NOT EXISTS batch_sessions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'paused', 'completed', 'stopped', 'failed'
    total_jobs INTEGER NOT NULL,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    failed_jobs INTEGER NOT NULL DEFAULT 0,
    skipped_jobs INTEGER NOT NULL DEFAULT 0,
    current_job_id INTEGER,
    started_at DATETIME,
    completed_at DATETIME,
    settings TEXT NOT NULL, -- JSON containing BatchSettings
    results TEXT, -- JSON containing BatchResults
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Batch Jobs Table
CREATE TABLE IF NOT EXISTS batch_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    job_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'skipped'
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at DATETIME,
    completed_at DATETIME,
    processing_time REAL, -- seconds
    FOREIGN KEY (session_id) REFERENCES batch_sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

-- Batch Logs Table
CREATE TABLE IF NOT EXISTS batch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    level TEXT NOT NULL, -- 'info', 'warning', 'error', 'success'
    message TEXT NOT NULL,
    job_id INTEGER,
    details TEXT, -- JSON containing additional details
    FOREIGN KEY (session_id) REFERENCES batch_sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_experience_company ON work_experience(company);
CREATE INDEX IF NOT EXISTS idx_education_institution ON education(institution);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_automation_logs_job ON automation_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_manual_assist_sessions_job_id ON manual_assist_sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_manual_assist_sessions_status ON manual_assist_sessions(status);
CREATE INDEX IF NOT EXISTS idx_manual_assist_sessions_captcha_detected ON manual_assist_sessions(captcha_detected);
CREATE INDEX IF NOT EXISTS idx_job_board_profiles_enabled ON job_board_profiles(enabled);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_status ON batch_sessions(status);
CREATE INDEX IF NOT EXISTS idx_batch_sessions_created_at ON batch_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_session_id ON batch_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_job_id ON batch_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_logs_session_id ON batch_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_batch_logs_timestamp ON batch_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_batch_logs_level ON batch_logs(level);
