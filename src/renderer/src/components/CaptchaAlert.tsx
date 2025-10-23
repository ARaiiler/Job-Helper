import React from 'react';
import { AlertTriangle, Shield, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { CaptchaDetection } from '@shared/types';

interface CaptchaAlertProps {
  detection: CaptchaDetection;
  onViewScreenshot: (path: string) => void;
  onOpenManualAssist: () => void;
  onRetryDetection: () => void;
}

const CaptchaAlert = ({ detection, onViewScreenshot, onOpenManualAssist, onRetryDetection }: CaptchaAlertProps) => {
  const getCaptchaIcon = (type: string) => {
    switch (type) {
      case 'recaptcha': return <Shield className="w-5 h-5 text-red-600" />;
      case 'hcaptcha': return <Shield className="w-5 h-5 text-orange-600" />;
      case 'cloudflare': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'turnstile': return <Shield className="w-5 h-5 text-purple-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
  };

  const getCaptchaColor = (type: string) => {
    switch (type) {
      case 'recaptcha': return 'bg-red-50 border-red-200';
      case 'hcaptcha': return 'bg-orange-50 border-orange-200';
      case 'cloudflare': return 'bg-blue-50 border-blue-200';
      case 'turnstile': return 'bg-purple-50 border-purple-200';
      default: return 'bg-red-50 border-red-200';
    }
  };

  const getCaptchaTextColor = (type: string) => {
    switch (type) {
      case 'recaptcha': return 'text-red-800';
      case 'hcaptcha': return 'text-orange-800';
      case 'cloudflare': return 'text-blue-800';
      case 'turnstile': return 'text-purple-800';
      default: return 'text-red-800';
    }
  };

  return (
    <div className={`p-6 border rounded-lg ${getCaptchaColor(detection.type)}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getCaptchaIcon(detection.type)}
          <h3 className={`ml-2 text-lg font-semibold ${getCaptchaTextColor(detection.type)}`}>
            CAPTCHA Protection Detected
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onRetryDetection}
            className="btn-secondary text-sm flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry Detection
          </button>
        </div>
      </div>

      {/* Detection Details */}
      <div className={`mb-4 text-sm ${getCaptchaTextColor(detection.type)}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Type:</strong> {detection.type.toUpperCase()}</p>
            <p><strong>Confidence:</strong> {Math.round(detection.confidence * 100)}%</p>
          </div>
          <div>
            <p><strong>Detected:</strong> {new Date(detection.detectedAt).toLocaleString()}</p>
            <p><strong>Page:</strong> {detection.pageUrl}</p>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className={`mb-4 ${getCaptchaTextColor(detection.type)}`}>
        <p className="font-medium mb-2">Detection Indicators:</p>
        <ul className="text-sm list-disc list-inside space-y-1">
          {detection.indicators.map((indicator, index) => (
            <li key={index}>{indicator}</li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {detection.screenshotPath && (
          <button
            onClick={() => onViewScreenshot(detection.screenshotPath!)}
            className="btn-secondary flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Screenshot
          </button>
        )}
        
        <button
          onClick={onOpenManualAssist}
          className="btn-primary flex items-center"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Manual Assist
        </button>
      </div>

      {/* Instructions */}
      <div className={`mt-4 p-3 rounded ${getCaptchaTextColor(detection.type)} bg-opacity-20`}>
        <p className="text-sm font-medium mb-1">Next Steps:</p>
        <p className="text-sm">
          Automation has been paused due to CAPTCHA protection. Use Manual Assist to:
        </p>
        <ul className="text-sm mt-1 list-disc list-inside">
          <li>Analyze the form with AI vision</li>
          <li>Get pre-filled data for manual entry</li>
          <li>Complete the application manually</li>
        </ul>
      </div>
    </div>
  );
};

export default CaptchaAlert;
