import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Monitor, Clock, Folder, User, Eye, EyeOff } from 'lucide-react';
import { AutomationSettings } from '@shared/types';

interface AutomationSettingsProps {
  onSettingsChange: (settings: AutomationSettings) => void;
}

const AutomationSettingsComponent = ({ onSettingsChange }: AutomationSettingsProps) => {
  const [settings, setSettings] = useState<AutomationSettings>({
    headless: true,
    timeout: 30000,
    screenshotDirectory: '',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: {
      width: 1920,
      height: 1080
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await window.electronAPI.getAutomationSettings();
      if (savedSettings) {
        setSettings(savedSettings);
        onSettingsChange(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load automation settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof AutomationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    // Save settings
    window.electronAPI.saveAutomationSettings(newSettings).catch(console.error);
  };

  const handleViewportChange = (key: 'width' | 'height', value: number) => {
    const newViewport = { ...settings.viewport, [key]: value };
    const newSettings = { ...settings, viewport: newViewport };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    // Save settings
    window.electronAPI.saveAutomationSettings(newSettings).catch(console.error);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Browser Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Monitor className="w-4 h-4 inline mr-2" />
          Browser Mode
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSettingChange('headless', true)}
            className={`p-3 border rounded-lg text-left transition-all ${
              settings.headless
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <EyeOff className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium text-sm">Headless</div>
                <div className="text-xs text-gray-600">Faster, no UI</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => handleSettingChange('headless', false)}
            className={`p-3 border rounded-lg text-left transition-all ${
              !settings.headless
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              <div>
                <div className="font-medium text-sm">Visible</div>
                <div className="text-xs text-gray-600">See browser window</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Timeout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Clock className="w-4 h-4 inline mr-2" />
          Timeout (seconds)
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 15000, label: '15s', description: 'Fast' },
            { value: 30000, label: '30s', description: 'Standard' },
            { value: 60000, label: '60s', description: 'Slow sites' }
          ].map((timeout) => (
            <button
              key={timeout.value}
              onClick={() => handleSettingChange('timeout', timeout.value)}
              className={`p-3 border rounded-lg text-center transition-all ${
                settings.timeout === timeout.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{timeout.label}</div>
              <div className="text-xs text-gray-600">{timeout.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Viewport Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Monitor className="w-4 h-4 inline mr-2" />
          Browser Size
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Width</label>
            <input
              type="number"
              value={settings.viewport.width}
              onChange={(e) => handleViewportChange('width', parseInt(e.target.value))}
              className="input-field"
              min="800"
              max="3840"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Height</label>
            <input
              type="number"
              value={settings.viewport.height}
              onChange={(e) => handleViewportChange('height', parseInt(e.target.value))}
              className="input-field"
              min="600"
              max="2160"
            />
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[
            { width: 1366, height: 768, label: 'Laptop' },
            { width: 1920, height: 1080, label: 'Desktop' },
            { width: 2560, height: 1440, label: '4K' }
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                handleViewportChange('width', preset.width);
                handleViewportChange('height', preset.height);
              }}
              className="btn-secondary text-xs"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot Directory */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Folder className="w-4 h-4 inline mr-2" />
          Screenshot Directory
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={settings.screenshotDirectory}
            onChange={(e) => handleSettingChange('screenshotDirectory', e.target.value)}
            className="input-field flex-1"
            placeholder="Path to save screenshots"
          />
          <button
            onClick={() => {
              // In a real implementation, this would open a folder picker
              const defaultPath = `${process.cwd()}/screenshots`;
              handleSettingChange('screenshotDirectory', defaultPath);
            }}
            className="btn-secondary text-sm"
          >
            Browse
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Screenshots will be saved here for debugging and verification
        </p>
      </div>

      {/* User Agent */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <User className="w-4 h-4 inline mr-2" />
          User Agent
        </label>
        <select
          value={settings.userAgent}
          onChange={(e) => handleSettingChange('userAgent', e.target.value)}
          className="input-field"
        >
          <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36">
            Chrome (Windows)
          </option>
          <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36">
            Chrome (macOS)
          </option>
          <option value="Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0">
            Firefox (Windows)
          </option>
          <option value="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15">
            Safari (macOS)
          </option>
        </select>
        <p className="text-xs text-gray-600 mt-1">
          Some sites may behave differently based on the browser type
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Automation Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use headless mode for faster automation</li>
          <li>• Increase timeout for slow-loading sites</li>
          <li>• Screenshots help debug detection issues</li>
          <li>• Some sites may block automated browsers</li>
        </ul>
      </div>
    </div>
  );
};

export default AutomationSettingsComponent;
