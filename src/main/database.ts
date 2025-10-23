import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Certification,
  Job,
  Application,
  JobStats,
  RecentActivity,
  JobAnalysis,
  ProfileMatch,
  TailoredContent,
  AutomationLog,
  ManualAssistSession
} from '../shared/types';

export default class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Read and execute schema
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      this.db.exec(schema, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Personal Info methods
  async getPersonalInfo(): Promise<PersonalInfo | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM personal_info LIMIT 1',
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as PersonalInfo || null);
          }
        }
      );
    });
  }

  async savePersonalInfo(data: PersonalInfo): Promise<PersonalInfo> {
    return new Promise((resolve, reject) => {
      const { id, name, email, phone, location, linkedin, portfolio } = data;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE personal_info SET 
           name = ?, email = ?, phone = ?, location = ?, 
           linkedin = ?, portfolio = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [name, email, phone, location, linkedin, portfolio, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO personal_info (name, email, phone, location, linkedin, portfolio) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name, email, phone, location, linkedin, portfolio],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  // Work Experience methods
  async getAllWorkExperience(): Promise<WorkExperience[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM work_experience ORDER BY start_date DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const experiences = rows.map(row => ({
              ...row,
              achievements: JSON.parse(row.achievements || '[]')
            }));
            resolve(experiences);
          }
        }
      );
    });
  }

  async saveWorkExperience(data: WorkExperience): Promise<WorkExperience> {
    return new Promise((resolve, reject) => {
      const { id, company, title, start_date, end_date, description, achievements } = data;
      const achievementsJson = JSON.stringify(achievements);
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE work_experience SET 
           company = ?, title = ?, start_date = ?, end_date = ?, 
           description = ?, achievements = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [company, title, start_date, end_date, description, achievementsJson, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO work_experience (company, title, start_date, end_date, description, achievements) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [company, title, start_date, end_date, description, achievementsJson],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async deleteWorkExperience(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM work_experience WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Education methods
  async getAllEducation(): Promise<Education[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM education ORDER BY start_date DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Education[]);
          }
        }
      );
    });
  }

  async saveEducation(data: Education): Promise<Education> {
    return new Promise((resolve, reject) => {
      const { id, institution, degree, field, start_date, end_date, gpa } = data;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE education SET 
           institution = ?, degree = ?, field = ?, start_date = ?, 
           end_date = ?, gpa = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [institution, degree, field, start_date, end_date, gpa, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO education (institution, degree, field, start_date, end_date, gpa) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [institution, degree, field, start_date, end_date, gpa],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async deleteEducation(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM education WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Skills methods
  async getAllSkills(): Promise<Skill[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM skills ORDER BY category, name',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Skill[]);
          }
        }
      );
    });
  }

  async saveSkill(data: Skill): Promise<Skill> {
    return new Promise((resolve, reject) => {
      const { id, name, category, proficiency_level } = data;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE skills SET 
           name = ?, category = ?, proficiency_level = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [name, category, proficiency_level, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO skills (name, category, proficiency_level) 
           VALUES (?, ?, ?)`,
          [name, category, proficiency_level],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async deleteSkill(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM skills WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Certifications methods
  async getAllCertifications(): Promise<Certification[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM certifications ORDER BY date DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Certification[]);
          }
        }
      );
    });
  }

  async saveCertification(data: Certification): Promise<Certification> {
    return new Promise((resolve, reject) => {
      const { id, name, issuer, date, credential_id } = data;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE certifications SET 
           name = ?, issuer = ?, date = ?, credential_id = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [name, issuer, date, credential_id, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO certifications (name, issuer, date, credential_id) 
           VALUES (?, ?, ?, ?)`,
          [name, issuer, date, credential_id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async deleteCertification(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM certifications WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Job methods
  async getAllJobs(): Promise<Job[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM jobs ORDER BY date_added DESC',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const jobs = rows.map(row => ({
              ...row,
              analysis_data: row.analysis_data ? JSON.parse(row.analysis_data) : undefined
            }));
            resolve(jobs as Job[]);
          }
        }
      );
    });
  }

  async getJobById(id: number): Promise<Job | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM jobs WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              const job = {
                ...row,
                analysis_data: row.analysis_data ? JSON.parse(row.analysis_data) : undefined
              };
              resolve(job as Job);
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  }

  async saveJob(data: Job): Promise<Job> {
    return new Promise((resolve, reject) => {
      const { id, company, position, job_url, description, status, notes, analysis_data, match_score, analyzed_at } = data;
      const analysisJson = analysis_data ? JSON.stringify(analysis_data) : null;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE jobs SET 
           company = ?, position = ?, job_url = ?, description = ?, 
           status = ?, notes = ?, analysis_data = ?, match_score = ?, 
           analyzed_at = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [company, position, job_url, description, status, notes, analysisJson, match_score, analyzed_at, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO jobs (company, position, job_url, description, status, notes, analysis_data, match_score, analyzed_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [company, position, job_url, description, status, notes, analysisJson, match_score, analyzed_at],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async deleteJob(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM jobs WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getJobStats(): Promise<JobStats> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as queued,
          SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END) as applied,
          SUM(CASE WHEN status = 'interviewing' THEN 1 ELSE 0 END) as interviewing,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
          SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offers
         FROM jobs`,
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              total: row.total || 0,
              queued: row.queued || 0,
              applied: row.applied || 0,
              interviewing: row.interviewing || 0,
              rejected: row.rejected || 0,
              offers: row.offers || 0
            });
          }
        }
      );
    });
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          j.id,
          'job_added' as type,
          'Added job: ' || j.company || ' - ' || j.position as description,
          j.created_at as timestamp,
          j.id as job_id
         FROM jobs j
         ORDER BY j.created_at DESC
         LIMIT 10`,
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as RecentActivity[]);
          }
        }
      );
    });
  }

  // Application methods
  async getApplicationsByJob(jobId: number): Promise<Application[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM applications WHERE job_id = ? ORDER BY applied_date DESC',
        [jobId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows as Application[]);
          }
        }
      );
    });
  }

  async saveApplication(data: Application): Promise<Application> {
    return new Promise((resolve, reject) => {
      const { id, job_id, applied_date, tailored_resume_path, tailored_content, status } = data;
      const tailoredContentJson = tailored_content ? JSON.stringify(tailored_content) : null;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE applications SET 
           job_id = ?, applied_date = ?, tailored_resume_path = ?, 
           tailored_content = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [job_id, applied_date, tailored_resume_path, tailoredContentJson, status, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO applications (job_id, applied_date, tailored_resume_path, tailored_content, status) 
           VALUES (?, ?, ?, ?, ?)`,
          [job_id, applied_date, tailored_resume_path, tailoredContentJson, status],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...data, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async deleteApplication(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM applications WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Automation Logs
  async saveAutomationLog(log: AutomationLog): Promise<AutomationLog> {
    return new Promise((resolve, reject) => {
      const { id, job_id, application_id, action, status, details, screenshot_path } = log;
      const detailsJson = details ? JSON.stringify(details) : null;
      
      if (id) {
        // Update existing
        this.db.run(
          `UPDATE automation_logs SET 
           job_id = ?, application_id = ?, action = ?, status = ?, 
           details = ?, screenshot_path = ?, created_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [job_id, application_id, action, status, detailsJson, screenshot_path, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...log, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO automation_logs (job_id, application_id, action, status, details, screenshot_path) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [job_id, application_id, action, status, detailsJson, screenshot_path],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...log, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async getAutomationLogsByJob(jobId: number): Promise<AutomationLog[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM automation_logs WHERE job_id = ? ORDER BY created_at DESC',
        [jobId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const logs = rows.map(row => ({
              id: row.id,
              job_id: row.job_id,
              application_id: row.application_id,
              action: row.action,
              status: row.status,
              details: row.details ? JSON.parse(row.details) : undefined,
              screenshot_path: row.screenshot_path,
              created_at: row.created_at
            }));
            resolve(logs);
          }
        }
      );
    });
  }

  async deleteAutomationLog(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM automation_logs WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }

  // Manual Assist Sessions
  async saveManualAssistSession(session: ManualAssistSession): Promise<ManualAssistSession> {
    return new Promise((resolve, reject) => {
      const { id, job_id, application_id, captcha_detected, captcha_type, screenshot_path, form_url, vision_analysis, prefill_data, status, completed_at } = session;
      const visionAnalysisJson = vision_analysis ? JSON.stringify(vision_analysis) : null;

      if (id) {
        // Update existing
        this.db.run(
          `UPDATE manual_assist_sessions SET
           job_id = ?, application_id = ?, captcha_detected = ?, captcha_type = ?,
           screenshot_path = ?, form_url = ?, vision_analysis = ?, prefill_data = ?,
           status = ?, completed_at = ?
           WHERE id = ?`,
          [job_id, application_id, captcha_detected, captcha_type, screenshot_path, form_url, visionAnalysisJson, prefill_data, status, completed_at, id],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...session, id });
            }
          }
        );
      } else {
        // Insert new
        this.db.run(
          `INSERT INTO manual_assist_sessions (job_id, application_id, captcha_detected, captcha_type, screenshot_path, form_url, vision_analysis, prefill_data, status, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [job_id, application_id, captcha_detected, captcha_type, screenshot_path, form_url, visionAnalysisJson, prefill_data, status, completed_at],
          function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({ ...session, id: this.lastID });
            }
          }
        );
      }
    });
  }

  async getManualAssistSessionsByJob(jobId: number): Promise<ManualAssistSession[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM manual_assist_sessions WHERE job_id = ? ORDER BY created_at DESC',
        [jobId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            const sessions = rows.map(row => ({
              id: row.id,
              job_id: row.job_id,
              application_id: row.application_id,
              captcha_detected: Boolean(row.captcha_detected),
              captcha_type: row.captcha_type,
              screenshot_path: row.screenshot_path,
              form_url: row.form_url,
              vision_analysis: row.vision_analysis ? JSON.parse(row.vision_analysis) : undefined,
              prefill_data: row.prefill_data,
              status: row.status,
              created_at: row.created_at,
              completed_at: row.completed_at
            }));
            resolve(sessions);
          }
        }
      );
    });
  }

  async deleteManualAssistSession(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM manual_assist_sessions WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Export/Import methods
  async exportAllData(): Promise<any> {
    return new Promise((resolve, reject) => {
      const exportData: any = {
        personalInfo: null,
        workExperience: [],
        education: [],
        skills: [],
        certifications: [],
        jobs: [],
        applications: [],
        automationLogs: [],
        manualAssistSessions: []
      };

      // Get personal info
      this.db.get('SELECT * FROM personal_info LIMIT 1', (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }
        exportData.personalInfo = row;

        // Get all other data
        this.db.all('SELECT * FROM work_experience', (err, rows: any) => {
          if (err) {
            reject(err);
            return;
          }
          exportData.workExperience = rows;

          this.db.all('SELECT * FROM education', (err, rows: any) => {
            if (err) {
              reject(err);
              return;
            }
            exportData.education = rows;

            this.db.all('SELECT * FROM skills', (err, rows: any) => {
              if (err) {
                reject(err);
                return;
              }
              exportData.skills = rows;

              this.db.all('SELECT * FROM certifications', (err, rows: any) => {
                if (err) {
                  reject(err);
                  return;
                }
                exportData.certifications = rows;

                this.db.all('SELECT * FROM jobs', (err, rows: any) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  exportData.jobs = rows;

                  this.db.all('SELECT * FROM applications', (err, rows: any) => {
                    if (err) {
                      reject(err);
                      return;
                    }
                    exportData.applications = rows;

                    this.db.all('SELECT * FROM automation_logs', (err, rows: any) => {
                      if (err) {
                        reject(err);
                        return;
                      }
                      exportData.automationLogs = rows;

                      this.db.all('SELECT * FROM manual_assist_sessions', (err, rows: any) => {
                        if (err) {
                          reject(err);
                          return;
                        }
                        exportData.manualAssistSessions = rows;
                        resolve(exportData);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  async importAllData(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Clear existing data
      const clearQueries = [
        'DELETE FROM manual_assist_sessions',
        'DELETE FROM automation_logs',
        'DELETE FROM applications',
        'DELETE FROM jobs',
        'DELETE FROM certifications',
        'DELETE FROM skills',
        'DELETE FROM education',
        'DELETE FROM work_experience',
        'DELETE FROM personal_info'
      ];

      let completed = 0;
      clearQueries.forEach(query => {
        this.db.run(query, (err) => {
          if (err) {
            reject(err);
            return;
          }
          completed++;
          if (completed === clearQueries.length) {
            // Import new data
            this.importData(data, resolve, reject);
          }
        });
      });
    });
  }

  private async importData(data: any, resolve: Function, reject: Function): Promise<void> {
    try {
      // Import personal info
      if (data.personalInfo) {
        await this.savePersonalInfo(data.personalInfo);
      }

      // Import work experience
      for (const item of data.workExperience || []) {
        await this.saveWorkExperience(item);
      }

      // Import education
      for (const item of data.education || []) {
        await this.saveEducation(item);
      }

      // Import skills
      for (const item of data.skills || []) {
        await this.saveSkill(item);
      }

      // Import certifications
      for (const item of data.certifications || []) {
        await this.saveCertification(item);
      }

      // Import jobs
      for (const item of data.jobs || []) {
        await this.saveJob(item);
      }

      // Import applications
      for (const item of data.applications || []) {
        await this.saveApplication(item);
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  }

  async exportApplicationsCSV(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          j.company,
          j.position,
          j.job_url,
          j.status as job_status,
          a.applied_date,
          a.status as application_status,
          a.automation_type
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        ORDER BY j.date_added DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        // Convert to CSV
        const headers = ['Company', 'Position', 'Job URL', 'Job Status', 'Applied Date', 'Application Status', 'Automation Type'];
        const csvRows = [headers.join(',')];
        
        rows.forEach((row: any) => {
          const values = [
            `"${row.company || ''}"`,
            `"${row.position || ''}"`,
            `"${row.job_url || ''}"`,
            `"${row.job_status || ''}"`,
            `"${row.applied_date || ''}"`,
            `"${row.application_status || ''}"`,
            `"${row.automation_type || ''}"`
          ];
          csvRows.push(values.join(','));
        });

        resolve(csvRows.join('\n'));
      });
    });
  }
}
