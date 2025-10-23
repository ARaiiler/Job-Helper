import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Square, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { BatchProgress, BatchLog } from '@shared/types';

interface BatchProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: BatchProgress | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const BatchProgressModal = ({ isOpen, onClose, progress, onPause, onResume, onStop }: BatchProgressModalProps) => {
  const [logs, setLogs] = useState<BatchLog[]>([]);

  useEffect(() => {
    if (progress) {
      setLogs(progress.logs);
    }
  }, [progress]);

  if (!isOpen || !progress) return null;

  const getStatusColor = (level: BatchLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (level: BatchLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <h2 className="text-xl font-semibold text-gray-900">Batch Processing</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Progress Overview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Progress Overview</h3>
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(progress.progress_percentage)}%
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress_percentage}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm text-green-800">Completed</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">✗</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">⏱</div>
                <div className="text-sm text-blue-800">Remaining</div>
              </div>
            </div>
          </div>

          {/* Current Job */}
          {progress.current_job && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Currently Processing</h4>
              <div className="text-sm text-blue-800">
                <p><strong>Company:</strong> {progress.current_job.company}</p>
                <p><strong>Position:</strong> {progress.current_job.position}</p>
                <p><strong>URL:</strong> {progress.current_job.job_url}</p>
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {progress.estimated_remaining_time > 0 && (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <h4 className="font-medium text-gray-900">Estimated Time Remaining</h4>
                  <p className="text-sm text-gray-600">
                    {Math.round(progress.estimated_remaining_time / 60)} minutes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Log</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No logs yet...</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`mt-0.5 ${getStatusColor(log.level)}`}>
                        {getStatusIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          {log.job_id && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              Job {log.job_id}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${getStatusColor(log.level)}`}>
                          {log.message}
                        </p>
                        {log.details && (
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-2">
            <button
              onClick={onPause}
              className="btn-secondary flex items-center"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </button>
            <button
              onClick={onResume}
              className="btn-secondary flex items-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </button>
            <button
              onClick={onStop}
              className="btn-danger flex items-center"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </button>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchProgressModal;
