import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  context?: any;
  userId?: string;
  sessionId?: string;
}

export default class ErrorLoggingService {
  private logDir: string;
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;

  constructor() {
    this.logDir = path.join(app.getPath('userData'), 'logs');
    this.logFile = path.join(this.logDir, 'error.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private rotateLogs(): void {
    if (!fs.existsSync(this.logFile)) return;

    const stats = fs.statSync(this.logFile);
    if (stats.size > this.maxLogSize) {
      // Rotate existing logs
      for (let i = this.maxLogFiles - 1; i > 0; i--) {
        const oldFile = `${this.logFile}.${i}`;
        const newFile = `${this.logFile}.${i + 1}`;
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }

      // Move current log to .1
      fs.renameSync(this.logFile, `${this.logFile}.1`);
    }
  }

  log(level: ErrorLog['level'], message: string, error?: Error, context?: any): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      stack: error?.stack,
      context: {
        ...context,
        userAgent: process.env.USER_AGENT,
        platform: process.platform,
        version: app.getVersion()
      }
    };

    this.writeToFile(errorLog);
    this.writeToConsole(errorLog);
  }

  error(message: string, error?: Error, context?: any): void {
    this.log('error', message, error, context);
  }

  warning(message: string, context?: any): void {
    this.log('warning', message, undefined, context);
  }

  info(message: string, context?: any): void {
    this.log('info', message, undefined, context);
  }

  private writeToFile(errorLog: ErrorLog): void {
    try {
      this.rotateLogs();
      
      const logEntry = JSON.stringify(errorLog) + '\n';
      fs.appendFileSync(this.logFile, logEntry);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  private writeToConsole(errorLog: ErrorLog): void {
    const timestamp = new Date(errorLog.timestamp).toLocaleString();
    const prefix = `[${timestamp}] [${errorLog.level.toUpperCase()}]`;
    
    switch (errorLog.level) {
      case 'error':
        console.error(`${prefix} ${errorLog.message}`, errorLog.stack, errorLog.context);
        break;
      case 'warning':
        console.warn(`${prefix} ${errorLog.message}`, errorLog.context);
        break;
      case 'info':
        console.info(`${prefix} ${errorLog.message}`, errorLog.context);
        break;
    }
  }

  async getLogs(limit: number = 100, level?: ErrorLog['level']): Promise<ErrorLog[]> {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      let logs: ErrorLog[] = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(log => log !== null)
        .filter(log => !level || log.level === level)
        .slice(-limit);

      return logs.reverse(); // Most recent first
    } catch (err) {
      console.error('Failed to read logs:', err);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.unlinkSync(this.logFile);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  }

  async exportLogs(): Promise<string> {
    try {
      const logs = await this.getLogs(1000);
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalLogs: logs.length,
        logs
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (err) {
      console.error('Failed to export logs:', err);
      return '';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Get error statistics
  async getErrorStats(): Promise<{
    totalErrors: number;
    errorsByLevel: { [key: string]: number };
    recentErrors: ErrorLog[];
    mostCommonErrors: Array<{ message: string; count: number }>;
  }> {
    const logs = await this.getLogs(1000);
    
    const errorsByLevel = logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const errorMessages = logs
      .filter(log => log.level === 'error')
      .map(log => log.message);
    
    const messageCounts = errorMessages.reduce((acc, message) => {
      acc[message] = (acc[message] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const mostCommonErrors = Object.entries(messageCounts)
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: logs.length,
      errorsByLevel,
      recentErrors: logs.slice(0, 10),
      mostCommonErrors
    };
  }
}
