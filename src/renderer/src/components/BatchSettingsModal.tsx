import React, { useState, useEffect } from 'react';
import { X, Settings, Clock, Shield, Play, Pause, AlertTriangle } from 'lucide-react';
import { BatchSettings, JobBoardProfile } from '@shared/types';

interface BatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: BatchSettings) => void;
  availableBoards: JobBoardProfile[];
  defaultSettings?: BatchSettings;
}

const BatchSettingsModal = ({ isOpen, onClose, onSave, availableBoards, defaultSettings }: BatchSettingsModalProps) => {
  const [settings, setSettings] = useState<BatchSettings>({
    max_applications: 10,
    delay_min: 30,
    delay_max: 120,
    auto_submit: false,
    stop_on_error: true,
    retry_attempts: 2,
    dry_run: false,
    enabled_boards: []
  });

  useEffect(() => {
    if (defaultSettings) {
      setSettings(defaultSettings);
    }
  }, [defaultSettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  const handleBoardToggle = (boardId: string) => {
    setSettings(prev => ({
      ...prev,
      enabled_boards: prev.enabled_boards.includes(boardId)
        ? prev.enabled_boards.filter(id => id !== boardId)
        : [...prev.enabled_boards, boardId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Settings className="w-6 h-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Batch Processing Settings</h2>
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
          {/* Basic Settings */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Applications
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_applications}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_applications: parseInt(e.target.value) }))}
                  className="input-field w-full"
                />
                <p className="text-sm text-gray-500 mt-1">Maximum number of applications to process in this batch</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={settings.delay_min}
                    onChange={(e) => setSettings(prev => ({ ...prev, delay_min: parseInt(e.target.value) }))}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={settings.delay_max}
                    onChange={(e) => setSettings(prev => ({ ...prev, delay_max: parseInt(e.target.value) }))}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">Random delay between applications to avoid detection</p>
            </div>
          </div>

          {/* Job Board Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enabled Job Boards</h3>
            <div className="space-y-3">
              {availableBoards.map(board => (
                <div key={board.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`board-${board.id}`}
                        checked={settings.enabled_boards.includes(board.id)}
                        onChange={() => handleBoardToggle(board.id)}
                        className="mr-3"
                      />
                      <label htmlFor={`board-${board.id}`} className="font-medium text-gray-900">
                        {board.name}
                      </label>
                    </div>
                    <div className="ml-4 flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        board.captcha_likelihood === 'high' ? 'bg-red-100 text-red-800' :
                        board.captcha_likelihood === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        CAPTCHA: {board.captcha_likelihood}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {board.rate_limit.max_per_hour}/hour
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Only jobs from enabled boards will be processed</p>
          </div>

          {/* Processing Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Auto Submit Applications</label>
                  <p className="text-sm text-gray-500">Automatically submit applications without manual review</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_submit}
                  onChange={(e) => setSettings(prev => ({ ...prev, auto_submit: e.target.checked }))}
                  className="ml-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Stop on Error</label>
                  <p className="text-sm text-gray-500">Stop batch processing if any job fails</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.stop_on_error}
                  onChange={(e) => setSettings(prev => ({ ...prev, stop_on_error: e.target.checked }))}
                  className="ml-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">Dry Run Mode</label>
                  <p className="text-sm text-gray-500">Detect fields and analyze but don't submit applications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.dry_run}
                  onChange={(e) => setSettings(prev => ({ ...prev, dry_run: e.target.checked }))}
                  className="ml-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={settings.retry_attempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, retry_attempts: parseInt(e.target.value) }))}
                  className="input-field w-20"
                />
                <p className="text-sm text-gray-500 mt-1">Number of retry attempts for failed jobs</p>
              </div>
            </div>
          </div>

          {/* Safety Warning */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <h4 className="font-medium text-yellow-800">Safety Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Batch processing applies to multiple jobs automatically. Make sure your profile is complete 
                  and review the settings before starting. Consider using dry run mode first.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchSettingsModal;
