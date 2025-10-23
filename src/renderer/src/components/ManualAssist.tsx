import React, { useState, useRef } from 'react';
import { Upload, Eye, Copy, Download, ExternalLink, AlertTriangle, CheckCircle, Brain, FileText, User, Mail, Phone, MapPin, Link } from 'lucide-react';
import { VisionAnalysis, VisionField, ManualAssistSession, CaptchaDetection } from '@shared/types';

interface ManualAssistProps {
  jobId: number;
  applicationId?: number;
  captchaDetection?: CaptchaDetection;
  onSessionCreated: (session: ManualAssistSession) => void;
}

const ManualAssist = ({ jobId, applicationId, captchaDetection, onSessionCreated }: ManualAssistProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);
  const [session, setSession] = useState<ManualAssistSession | null>(null);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null);
  const [formUrl, setFormUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedScreenshot(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedScreenshot(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeForm = async () => {
    if (!uploadedScreenshot && !captchaDetection?.screenshotPath) {
      alert('Please upload a screenshot or ensure CAPTCHA detection has a screenshot');
      return;
    }

    setIsAnalyzing(true);
    try {
      // For now, we'll use the CAPTCHA screenshot if available, otherwise the uploaded one
      const screenshotPath = captchaDetection?.screenshotPath || uploadedScreenshot;
      
      if (typeof screenshotPath === 'string' && screenshotPath.startsWith('data:')) {
        // Convert data URL to file path (this would need proper file handling in a real implementation)
        alert('File upload analysis not fully implemented yet. Please use CAPTCHA detection screenshots.');
        return;
      }

      const analysis = await window.electronAPI.analyzeFormVision(screenshotPath as string);
      setVisionAnalysis(analysis);

      // Create or update session
      if (!session) {
        const newSession = await window.electronAPI.createManualAssistSession(jobId, applicationId);
        setSession(newSession);
        onSessionCreated(newSession);
      }

    } catch (error) {
      console.error('Form analysis failed:', error);
      alert('Form analysis failed. Please check your OpenAI API key and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyField = (field: VisionField) => {
    if (field.value) {
      navigator.clipboard.writeText(field.value);
    }
  };

  const handleCopyAll = () => {
    if (!visionAnalysis) return;
    
    const allData = visionAnalysis.fields.map(field => ({
      label: field.label,
      value: field.value || '',
      type: field.type,
      required: field.required
    }));
    
    navigator.clipboard.writeText(JSON.stringify(allData, null, 2));
  };

  const handleExportJSON = () => {
    if (!visionAnalysis) return;
    
    const dataStr = JSON.stringify(visionAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-analysis-${jobId}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleOpenExternalBrowser = async () => {
    const url = formUrl || captchaDetection?.pageUrl;
    if (url) {
      try {
        await window.electronAPI.openExternalBrowser(url);
      } catch (error) {
        console.error('Failed to open external browser:', error);
        alert('Failed to open external browser');
      }
    }
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'tel': return <Phone className="w-4 h-4" />;
      case 'text': return <User className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      case 'select': return <ExternalLink className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getFieldTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'tel': return 'bg-green-100 text-green-800';
      case 'text': return 'bg-gray-100 text-gray-800';
      case 'textarea': return 'bg-purple-100 text-purple-800';
      case 'file': return 'bg-orange-100 text-orange-800';
      case 'select': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* CAPTCHA Detection Alert */}
      {captchaDetection && captchaDetection.detected && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-medium text-red-800">CAPTCHA Detected</h3>
          </div>
          <div className="text-sm text-red-700 mb-3">
            <p><strong>Type:</strong> {captchaDetection.type}</p>
            <p><strong>Confidence:</strong> {Math.round(captchaDetection.confidence * 100)}%</p>
            <p><strong>Detected at:</strong> {new Date(captchaDetection.detectedAt).toLocaleString()}</p>
          </div>
          <div className="text-sm text-red-600">
            <p className="font-medium mb-1">Indicators found:</p>
            <ul className="list-disc list-inside">
              {captchaDetection.indicators.map((indicator, index) => (
                <li key={index}>{indicator}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Screenshot Upload */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Form Screenshot</h3>
        
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {uploadedScreenshot ? (
            <div className="space-y-4">
              <img 
                src={uploadedScreenshot} 
                alt="Uploaded screenshot" 
                className="max-w-full h-64 object-contain mx-auto rounded"
              />
              <button
                onClick={() => setUploadedScreenshot(null)}
                className="btn-secondary text-sm"
              >
                Remove Screenshot
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-600 mb-2">Drag and drop a screenshot here, or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary"
                >
                  Choose File
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Supports PNG, JPG, and other image formats
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Form URL Input */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form URL (Optional)</h3>
        <div className="flex space-x-2">
          <input
            type="url"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://example.com/apply"
            className="input-field flex-1"
          />
          <button
            onClick={handleOpenExternalBrowser}
            disabled={!formUrl && !captchaDetection?.pageUrl}
            className="btn-secondary flex items-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in Browser
          </button>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="text-center">
        <button
          onClick={handleAnalyzeForm}
          disabled={isAnalyzing || (!uploadedScreenshot && !captchaDetection?.screenshotPath)}
          className="btn-primary flex items-center mx-auto"
        >
          {isAnalyzing ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          {isAnalyzing ? 'Analyzing Form...' : 'Analyze Form with AI'}
        </button>
      </div>

      {/* Vision Analysis Results */}
      {visionAnalysis && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Form Analysis Complete</h3>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyAll}
                className="btn-secondary text-sm flex items-center"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy All
              </button>
              <button
                onClick={handleExportJSON}
                className="btn-secondary text-sm flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export JSON
              </button>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Fields Detected:</strong> {visionAnalysis.fields.length}</p>
            <p><strong>Overall Confidence:</strong> {Math.round(visionAnalysis.confidence * 100)}%</p>
            <p><strong>Analysis Time:</strong> {visionAnalysis.analysisTime}</p>
            <p><strong>Model:</strong> {visionAnalysis.model}</p>
          </div>

          <div className="space-y-3">
            {visionAnalysis.fields.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getFieldIcon(field.type)}
                    <span className="ml-2 font-medium text-gray-900">
                      {field.label}
                    </span>
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getFieldTypeColor(field.type)}`}>
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500">
                      {Math.round(field.confidence * 100)}%
                    </div>
                    <button
                      onClick={() => handleCopyField(field)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </button>
                  </div>
                </div>

                {field.value && (
                  <div className="bg-gray-50 rounded p-2 text-sm text-gray-700">
                    <strong>Pre-filled Value:</strong> {field.value}
                  </div>
                )}

                {field.placeholder && (
                  <div className="text-sm text-gray-500 mt-1">
                    <strong>Placeholder:</strong> {field.placeholder}
                  </div>
                )}

                {field.options && field.options.length > 0 && (
                  <div className="text-sm text-gray-500 mt-1">
                    <strong>Options:</strong> {field.options.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Manual Application Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. <strong>Solve the CAPTCHA</strong> manually in your browser</p>
          <p>2. <strong>Copy the pre-filled data</strong> from the analysis above</p>
          <p>3. <strong>Paste the data</strong> into the corresponding form fields</p>
          <p>4. <strong>Upload your resume</strong> if required</p>
          <p>5. <strong>Review and submit</strong> the application</p>
          <p>6. <strong>Mark as completed</strong> in the job tracking system</p>
        </div>
      </div>
    </div>
  );
};

export default ManualAssist;
