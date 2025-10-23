import React from 'react';
import { CheckCircle, XCircle, Clock, TrendingUp, Download, BarChart3, AlertTriangle } from 'lucide-react';
import { BatchResults, BatchSession } from '@shared/types';

interface BatchResultsDashboardProps {
  session: BatchSession;
  results: BatchResults;
  onClose: () => void;
  onExportResults: () => void;
}

const BatchResultsDashboard = ({ session, results, onClose, onExportResults }: BatchResultsDashboardProps) => {
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBgColor = (rate: number): string => {
    if (rate >= 80) return 'bg-green-50 border-green-200';
    if (rate >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Batch Processing Results</h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onExportResults}
              className="btn-secondary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-green-800">{session.completed_jobs}</div>
                  <div className="text-sm text-green-600">Successful</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-red-800">{session.failed_jobs}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-blue-800">{session.skipped_jobs}</div>
                  <div className="text-sm text-blue-600">Skipped</div>
                </div>
              </div>
            </div>

            <div className={`p-4 border rounded-lg ${getSuccessRateBgColor(results.success_rate)}`}>
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 mr-3" />
                <div>
                  <div className={`text-2xl font-bold ${getSuccessRateColor(results.success_rate)}`}>
                    {Math.round(results.success_rate)}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-medium">{formatTime(results.total_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average per Job:</span>
                  <span className="font-medium">{formatTime(results.average_time_per_job)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Jobs:</span>
                  <span className="font-medium">{session.total_jobs}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="font-medium">
                    {session.started_at ? new Date(session.started_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="font-medium">
                    {session.completed_at ? new Date(session.completed_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                    session.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Board Breakdown */}
          {Object.keys(results.job_board_breakdown).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Board Performance</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job Board
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Successful
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Failed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(results.job_board_breakdown).map(([boardId, stats]) => (
                      <tr key={boardId}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {boardId}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {stats.total}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600">
                          {stats.successful}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600">
                          {stats.failed}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatTime(stats.average_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Common Failures */}
          {results.common_failures.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Failure Points</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="font-medium text-red-800">Issues Encountered</h4>
                </div>
                <ul className="space-y-1">
                  {results.common_failures.map((failure, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      {failure}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {results.success_rate < 60 && (
                <p>• Consider reviewing job board profiles for better field detection</p>
              )}
              {results.common_failures.some(f => f.includes('CAPTCHA')) && (
                <p>• Enable manual assist mode for CAPTCHA-protected sites</p>
              )}
              {results.average_time_per_job > 300 && (
                <p>• Consider increasing delay times to avoid rate limiting</p>
              )}
              {session.skipped_jobs > 0 && (
                <p>• Review enabled job boards to include more job sources</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchResultsDashboard;
