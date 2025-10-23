import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { BatchSession, BatchJob, BatchSettings, BatchProgress, BatchLog, BatchResults, Job, JobBoardProfile } from '../shared/types';
import Database from './database';
import AutomationService from './automation-service';
import JobBoardProfilesService from './job-board-profiles-service';

export default class BatchProcessingService extends EventEmitter {
  private sessions: Map<string, BatchSession> = new Map();
  private activeSession: BatchSession | null = null;
  private isProcessing: boolean = false;
  private database: Database;
  private automationService: AutomationService;
  private jobBoardService: JobBoardProfilesService;

  constructor(database: Database, automationService: AutomationService, jobBoardService: JobBoardProfilesService) {
    super();
    this.database = database;
    this.automationService = automationService;
    this.jobBoardService = jobBoardService;
  }

  async startSession(jobIds: number[], settings: BatchSettings): Promise<string> {
    const sessionId = uuidv4();
    const session: BatchSession = {
      id: sessionId,
      status: 'pending',
      total_jobs: jobIds.length,
      completed_jobs: 0,
      failed_jobs: 0,
      skipped_jobs: 0,
      settings,
      results: {
        success_rate: 0,
        average_time_per_job: 0,
        total_time: 0,
        common_failures: [],
        job_board_breakdown: {}
      }
    };

    this.sessions.set(sessionId, session);
    this.activeSession = session;

    // Start processing in background
    this.processBatch(sessionId, jobIds).catch(error => {
      console.error('Batch processing failed:', error);
      this.updateSessionStatus(sessionId, 'failed');
    });

    return sessionId;
  }

  private async processBatch(sessionId: string, jobIds: number[]): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.isProcessing = true;
    this.updateSessionStatus(sessionId, 'running');
    session.started_at = new Date().toISOString();

    this.addLog(sessionId, 'info', 'Batch processing started', undefined, { totalJobs: jobIds.length });

    for (let i = 0; i < jobIds.length; i++) {
      if (session.status === 'stopped') {
        this.addLog(sessionId, 'info', 'Batch processing stopped by user');
        break;
      }

      if (session.status === 'paused') {
        this.addLog(sessionId, 'info', 'Batch processing paused');
        // Wait for resume
        while (session.status === 'paused' && this.isProcessing && session.status !== 'stopped') {
          await this.delay(1000);
        }
        if (session.status === 'stopped') break;
      }

      const jobId = jobIds[i];
      session.current_job_id = jobId;
      
      try {
        const job = await this.database.getJobById(jobId);
        if (!job) {
          this.addLog(sessionId, 'warning', `Job ${jobId} not found, skipping`);
          session.skipped_jobs++;
          continue;
        }

        // Check if job board is enabled
        const jobBoard = this.jobBoardService.detectJobBoard(job.job_url || '');
        if (jobBoard && !session.settings.enabled_boards.includes(jobBoard.id)) {
          this.addLog(sessionId, 'info', `Job board ${jobBoard.name} not enabled, skipping job ${jobId}`);
          session.skipped_jobs++;
          continue;
        }

        this.addLog(sessionId, 'info', `Processing job ${jobId}: ${job.company} - ${job.position}`, jobId);

        const startTime = Date.now();
        await this.processJob(sessionId, job, jobBoard);
        const processingTime = (Date.now() - startTime) / 1000;

        session.completed_jobs++;
        session.results.job_board_breakdown[jobBoard?.id || 'unknown'] = {
          total: (session.results.job_board_breakdown[jobBoard?.id || 'unknown']?.total || 0) + 1,
          successful: (session.results.job_board_breakdown[jobBoard?.id || 'unknown']?.successful || 0) + 1,
          failed: session.results.job_board_breakdown[jobBoard?.id || 'unknown']?.failed || 0,
          average_time: processingTime
        };

        this.addLog(sessionId, 'success', `Job ${jobId} completed successfully`, jobId, { processingTime });

        // Rate limiting delay
        if (i < jobIds.length - 1) {
          const delay = this.calculateDelay(jobBoard);
          this.addLog(sessionId, 'info', `Waiting ${delay}s before next job (rate limiting)`);
          await this.delay(delay * 1000);
        }

      } catch (error) {
        session.failed_jobs++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        this.addLog(sessionId, 'error', `Job ${jobId} failed: ${errorMessage}`, jobId);
        
        // Update job board breakdown
        const jobBoard = this.jobBoardService.detectJobBoard((await this.database.getJobById(jobId))?.job_url || '');
        session.results.job_board_breakdown[jobBoard?.id || 'unknown'] = {
          total: (session.results.job_board_breakdown[jobBoard?.id || 'unknown']?.total || 0) + 1,
          successful: session.results.job_board_breakdown[jobBoard?.id || 'unknown']?.successful || 0,
          failed: (session.results.job_board_breakdown[jobBoard?.id || 'unknown']?.failed || 0) + 1,
          average_time: 0
        };

        if (session.settings.stop_on_error) {
          this.addLog(sessionId, 'error', 'Stopping batch due to error (stop_on_error enabled)');
          break;
        }
      }
    }

    // Calculate final results
    this.calculateResults(sessionId);
    this.updateSessionStatus(sessionId, 'completed');
    session.completed_at = new Date().toISOString();
    this.isProcessing = false;

    this.addLog(sessionId, 'success', 'Batch processing completed', undefined, {
      total: session.total_jobs,
      completed: session.completed_jobs,
      failed: session.failed_jobs,
      skipped: session.skipped_jobs
    });
  }

  private async processJob(sessionId: string, job: Job, jobBoard: JobBoardProfile | null): Promise<void> {
    if (!job.job_url) {
      throw new Error('Job URL not provided');
    }

    // Check rate limits
    await this.checkRateLimits(jobBoard);

    if (this.activeSession?.settings.dry_run) {
      this.addLog(sessionId, 'info', `Dry run: Would process job ${job.id}`, job.id);
      return;
    }

    // Initialize automation service
    await this.automationService.initialize();

    // Detect job page
    const detectionResult = await this.automationService.detectJobPage(job.job_url);
    if (!detectionResult.success) {
      throw new Error(`Failed to detect job page: ${detectionResult.errors.join(', ')}`);
    }

    // Check for CAPTCHA
    const captchaDetection = await this.automationService.detectCaptcha(job.job_url);
    if (captchaDetection.detected) {
      throw new Error(`CAPTCHA detected: ${captchaDetection.type}`);
    }

    // Auto-fill form
    const fillResult = await this.automationService.autoFillForm(job.job_url, await this.database.getPersonalInfo());
    if (!fillResult.success) {
      throw new Error(`Auto-fill failed: ${fillResult.errors.join(', ')}`);
    }

    // Submit application (if auto_submit is enabled)
    if (this.activeSession?.settings.auto_submit) {
      // This would need to be implemented in the automation service
      // For now, we'll just log that we would submit
      this.addLog(sessionId, 'info', `Would submit application for job ${job.id}`, job.id);
    }
  }

  private calculateDelay(jobBoard: JobBoardProfile | null): number {
    if (!jobBoard) {
      return Math.floor(Math.random() * (this.activeSession?.settings.delay_max || 120 - this.activeSession?.settings.delay_min || 30)) + (this.activeSession?.settings.delay_min || 30);
    }

    const minDelay = jobBoard.rate_limit.min_delay;
    const maxDelay = jobBoard.rate_limit.max_delay;
    return Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
  }

  private async checkRateLimits(jobBoard: JobBoardProfile | null): Promise<void> {
    if (!jobBoard) return;

    // This would need to be implemented with actual rate limiting logic
    // For now, we'll just use the delays
    this.addLog(this.activeSession?.id || '', 'info', `Rate limiting: ${jobBoard.name} (${jobBoard.rate_limit.max_per_hour}/hour, ${jobBoard.rate_limit.max_per_day}/day)`);
  }

  private calculateResults(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const totalProcessed = session.completed_jobs + session.failed_jobs;
    session.results.success_rate = totalProcessed > 0 ? (session.completed_jobs / totalProcessed) * 100 : 0;
    
    if (session.started_at && session.completed_at) {
      const totalTime = (new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000;
      session.results.total_time = totalTime;
      session.results.average_time_per_job = totalProcessed > 0 ? totalTime / totalProcessed : 0;
    }
  }

  private updateSessionStatus(sessionId: string, status: BatchSession['status']): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      this.sessions.set(sessionId, session);
      this.emit('sessionUpdated', session);
    }
  }

  private addLog(sessionId: string, level: BatchLog['level'], message: string, jobId?: number, details?: any): void {
    const log: BatchLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      job_id: jobId,
      details
    };

    this.emit('logAdded', { sessionId, log });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods
  getSession(sessionId: string): BatchSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getProgress(sessionId: string): BatchProgress | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const progressPercentage = session.total_jobs > 0 ? ((session.completed_jobs + session.failed_jobs) / session.total_jobs) * 100 : 0;
    
    return {
      session_id: sessionId,
      current_job: null, // Would need to fetch current job
      progress_percentage: progressPercentage,
      estimated_remaining_time: 0, // Would need to calculate based on average time
      logs: [] // Would need to store logs
    };
  }

  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'running') {
      this.updateSessionStatus(sessionId, 'paused');
      this.addLog(sessionId, 'info', 'Batch processing paused by user');
    }
  }

  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && session.status === 'paused') {
      this.updateSessionStatus(sessionId, 'running');
      this.addLog(sessionId, 'info', 'Batch processing resumed by user');
    }
  }

  stopSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session && (session.status === 'running' || session.status === 'paused')) {
      this.updateSessionStatus(sessionId, 'stopped');
      this.isProcessing = false;
      this.addLog(sessionId, 'info', 'Batch processing stopped by user');
    }
  }

  getAllSessions(): BatchSession[] {
    return Array.from(this.sessions.values());
  }

  getResults(sessionId: string): BatchResults | null {
    const session = this.sessions.get(sessionId);
    return session?.results || null;
  }
}
