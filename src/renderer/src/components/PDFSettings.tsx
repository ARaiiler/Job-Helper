import React, { useState, useEffect } from 'react';
import { FileText, Palette, Type, Settings as SettingsIcon } from 'lucide-react';
import { ResumeTemplate, PDFSettings } from '@shared/types';

interface PDFSettingsProps {
  onSettingsChange: (settings: PDFSettings) => void;
}

const PDFSettingsComponent = ({ onSettingsChange }: PDFSettingsProps) => {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [settings, setSettings] = useState<PDFSettings>({
    template: 'modern-clean',
    font: 'sans-serif',
    colorScheme: 'professional',
    fontSize: 'medium'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    loadSettings();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesData = await window.electronAPI.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await window.electronAPI.getPDFSettings();
      if (savedSettings) {
        setSettings(savedSettings);
        onSettingsChange(savedSettings);
      }
    } catch (error) {
      console.error('Failed to load PDF settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof PDFSettings, value: string) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
    
    // Save settings
    window.electronAPI.savePDFSettings(newSettings).catch(console.error);
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
      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <FileText className="w-4 h-4 inline mr-2" />
          Resume Template
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                settings.template === template.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSettingChange('template', template.id)}
            >
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
      </div>

      {/* Font Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Type className="w-4 h-4 inline mr-2" />
          Font Style
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSettingChange('font', 'sans-serif')}
            className={`p-3 border rounded-lg text-left transition-all ${
              settings.font === 'sans-serif'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-sans text-lg font-medium">Sans Serif</div>
            <div className="text-sm text-gray-600">Clean, modern look</div>
          </button>
          <button
            onClick={() => handleSettingChange('font', 'serif')}
            className={`p-3 border rounded-lg text-left transition-all ${
              settings.font === 'serif'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-serif text-lg font-medium">Serif</div>
            <div className="text-sm text-gray-600">Traditional, professional</div>
          </button>
        </div>
      </div>

      {/* Color Scheme */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <Palette className="w-4 h-4 inline mr-2" />
          Color Scheme
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { id: 'professional', name: 'Professional', color: 'bg-gray-600' },
            { id: 'blue', name: 'Blue', color: 'bg-blue-600' },
            { id: 'green', name: 'Green', color: 'bg-green-600' },
            { id: 'purple', name: 'Purple', color: 'bg-purple-600' }
          ].map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => handleSettingChange('colorScheme', scheme.id)}
              className={`p-3 border rounded-lg text-left transition-all ${
                settings.colorScheme === scheme.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full ${scheme.color} mr-3`}></div>
                <span className="text-sm font-medium">{scheme.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <SettingsIcon className="w-4 h-4 inline mr-2" />
          Font Size
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'small', name: 'Small', description: 'Compact' },
            { id: 'medium', name: 'Medium', description: 'Standard' },
            { id: 'large', name: 'Large', description: 'Easy to read' }
          ].map((size) => (
            <button
              key={size.id}
              onClick={() => handleSettingChange('fontSize', size.id)}
              className={`p-3 border rounded-lg text-center transition-all ${
                settings.fontSize === size.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{size.name}</div>
              <div className="text-xs text-gray-600">{size.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFSettingsComponent;
