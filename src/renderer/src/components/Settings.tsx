import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Database, Bell, Shield, Brain, Key, TestTube, RefreshCw, Trash2, FileText, Play } from 'lucide-react';

const Settings = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('gpt-3.5-turbo');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [automationSettings, setAutomationSettings] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadAutomationSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedApiKey, savedModel] = await Promise.all([
        window.electronAPI.getApiKey(),
        window.electronAPI.getModel()
      ]);
      setApiKey(savedApiKey || '');
      setModel(savedModel);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      await window.electronAPI.saveApiKey(apiKey);
      setConnectionStatus('idle');
    } catch (error) {
      console.error('Failed to save API key:', error);
    }
  };

  const handleSaveModel = async () => {
    try {
      await window.electronAPI.saveModel(model);
    } catch (error) {
      console.error('Failed to save model:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    
    try {
      const isConnected = await window.electronAPI.testAIConnection();
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleReindexProfile = async () => {
    setIsReindexing(true);
    try {
      await window.electronAPI.reindexProfile();
      alert('Profile reindexed successfully! Your resume tailoring will now use the latest profile data.');
    } catch (error) {
      console.error('Reindexing failed:', error);
      alert('Failed to reindex profile. Please try again.');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleClearEmbeddings = async () => {
    if (!confirm('Are you sure you want to clear all embeddings? This will require reindexing your profile.')) {
      return;
    }

    setIsClearing(true);
    try {
      await window.electronAPI.clearEmbeddings();
      alert('Embeddings cleared successfully! Please reindex your profile to continue using resume tailoring.');
    } catch (error) {
      console.error('Clearing embeddings failed:', error);
      alert('Failed to clear embeddings. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await window.electronAPI.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadAutomationSettings = async () => {
    try {
      const settings = await window.electronAPI.getAutomationSettings();
      setAutomationSettings(settings);
    } catch (error) {
      console.error('Failed to load automation settings:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="w-6 h-6 text-primary-600 mr-3" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Configuration */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Brain className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">AI Configuration</h2>
          </div>
          <p className="text-gray-600 mb-4">Configure OpenAI API for job analysis and profile matching.</p>
          
          <div className="space-y-4">
            <div>
              <label className="label">OpenAI API Key</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input-field flex-1"
                  placeholder="sk-..."
                />
                <button
                  onClick={handleSaveApiKey}
                  className="btn-primary flex items-center"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Your API key is encrypted and stored locally
              </p>
            </div>

            <div>
              <label className="label">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field"
              >
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
              </select>
              <button
                onClick={handleSaveModel}
                className="btn-secondary mt-2"
              >
                Save Model
              </button>
            </div>

            <div>
              <button
                onClick={handleTestConnection}
                disabled={!apiKey || isTestingConnection}
                className="btn-secondary flex items-center"
              >
                {isTestingConnection ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              
              {connectionStatus === 'success' && (
                <p className="text-green-600 text-sm mt-2">✓ Connection successful</p>
              )}
              {connectionStatus === 'error' && (
                <p className="text-red-600 text-sm mt-2">✗ Connection failed. Check your API key.</p>
              )}
            </div>
          </div>
        </div>

        {/* RAG Management */}
        <div className="card">
          <div className="flex items-center mb-4">
            <RefreshCw className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Resume Tailoring</h2>
          </div>
          <p className="text-gray-600 mb-4">Manage your profile embeddings for intelligent resume customization.</p>
          
          <div className="space-y-3">
            <button
              onClick={handleReindexProfile}
              disabled={isReindexing}
              className="btn-secondary w-full flex items-center justify-center"
            >
              {isReindexing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isReindexing ? 'Reindexing...' : 'Reindex Profile'}
            </button>
            
            <button
              onClick={handleClearEmbeddings}
              disabled={isClearing}
              className="btn-danger w-full flex items-center justify-center"
            >
              {isClearing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              {isClearing ? 'Clearing...' : 'Clear Embeddings'}
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Reindex Profile:</strong> Updates your profile embeddings with the latest data for better resume tailoring.
            </p>
          </div>
        </div>

        {/* PDF Templates */}
        <div className="card">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Resume Templates</h2>
          </div>
          <p className="text-gray-600 mb-4">Choose from professional resume templates for PDF generation.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="w-16 h-20 bg-gray-100 rounded mx-auto mb-3 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      template.category === 'modern' ? 'bg-blue-100 text-blue-800' :
                      template.category === 'ats' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {template.category.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Template Categories:</strong> Modern (clean design), ATS (applicant tracking system optimized), Creative (stylish with visual elements)
            </p>
          </div>
        </div>

        {/* Browser Automation */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Play className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Browser Automation</h2>
          </div>
          <p className="text-gray-600 mb-4">Configure browser automation settings for job application detection.</p>
          
          {automationSettings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Browser Mode</h4>
                  <p className="text-sm text-gray-600">
                    {automationSettings.headless ? 'Headless (faster)' : 'Visible (debugging)'}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeout</h4>
                  <p className="text-sm text-gray-600">
                    {automationSettings.timeout / 1000} seconds
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Viewport</h4>
                  <p className="text-sm text-gray-600">
                    {automationSettings.viewport.width} × {automationSettings.viewport.height}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Screenshots</h4>
                  <p className="text-sm text-gray-600">
                    {automationSettings.screenshotDirectory || 'Default location'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Play className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Automation settings not loaded</p>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Automation Features:</strong> Detect apply buttons, analyze form fields, take screenshots for debugging
            </p>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
          </div>
          <p className="text-gray-600 mb-4">Manage your personal information and preferences.</p>
          <a href="/profile" className="btn-primary">
            Go to Profile
          </a>
        </div>

        {/* Data Management */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Database className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
          </div>
          <p className="text-gray-600 mb-4">Export, import, or backup your data.</p>
          <div className="space-y-2">
            <button className="btn-secondary w-full">
              Export Data
            </button>
            <button className="btn-secondary w-full">
              Import Data
            </button>
            <button className="btn-secondary w-full">
              Clear All Data
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <p className="text-gray-600 mb-4">Configure notification preferences.</p>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Application reminders</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" defaultChecked />
              <span className="ml-2 text-sm text-gray-700">Interview notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="ml-2 text-sm text-gray-700">Weekly summary</span>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="card">
        <div className="flex items-center mb-4">
          <Shield className="w-5 h-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Privacy & Security</h2>
        </div>
        <p className="text-gray-600 mb-4">Manage your data privacy and security settings.</p>
        <div className="space-y-2">
          <button className="btn-secondary w-full">
            Change Password
          </button>
          <button className="btn-secondary w-full">
            Privacy Policy
          </button>
          <button className="btn-secondary w-full">
            Data Usage
          </button>
        </div>
      </div>

      {/* App Information */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">About Job Tracker</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900">Version</p>
            <p>1.0.0</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Build</p>
            <p>2024.01.01</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">License</p>
            <p>MIT</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;