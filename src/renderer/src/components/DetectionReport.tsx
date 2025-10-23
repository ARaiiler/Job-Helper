import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, FileText, User, Mail, Phone, Upload, Calendar } from 'lucide-react';
import { DetectionResult, FormField } from '@shared/types';

interface DetectionReportProps {
  result: DetectionResult;
  onViewScreenshot?: (path: string) => void;
}

const DetectionReport = ({ result, onViewScreenshot }: DetectionReportProps) => {
  const getFieldIcon = (type: FormField['type']) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'file': return <Upload className="w-4 h-4" />;
      case 'textarea': return <FileText className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getFieldTypeColor = (type: FormField['type']) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'file': return 'bg-purple-100 text-purple-800';
      case 'textarea': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Detection Summary</h3>
          <div className="flex items-center space-x-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.success ? 'Success' : 'Failed'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Page Information</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Title:</span> {result.pageTitle}</p>
              <p><span className="font-medium">URL:</span> 
                <a href={result.pageUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline ml-1">
                  {result.pageUrl}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Detection Results</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                {result.applyButtonFound ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 mr-2" />
                )}
                <span>Apply Button: {result.applyButtonFound ? 'Found' : 'Not Found'}</span>
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-blue-600 mr-2" />
                <span>Form Fields: {result.formFields.length}</span>
              </div>
            </div>
          </div>
        </div>

        {result.screenshotPath && onViewScreenshot && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onViewScreenshot(result.screenshotPath!)}
              className="btn-secondary flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Screenshot
            </button>
          </div>
        )}
      </div>

      {/* Apply Button Details */}
      {result.applyButtonFound && (
        <div className="card">
          <div className="flex items-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Apply Button Found</h3>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <span className="font-medium">Selector:</span> <code className="bg-green-100 px-2 py-1 rounded text-xs">{result.applyButtonSelector}</code>
            </p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      {result.formFields.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Detected Form Fields</h3>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {result.formFields.length} fields
            </span>
          </div>

          <div className="space-y-3">
            {result.formFields.map((field, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {getFieldIcon(field.type)}
                    <span className="ml-2 font-medium text-gray-900">
                      {field.name || field.id || 'Unnamed Field'}
                    </span>
                    {field.required && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getFieldTypeColor(field.type)}`}>
                    {field.type}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  {field.label && (
                    <p><span className="font-medium">Label:</span> {field.label}</p>
                  )}
                  {field.placeholder && (
                    <p><span className="font-medium">Placeholder:</span> {field.placeholder}</p>
                  )}
                  <p><span className="font-medium">Selector:</span> 
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs ml-1">{field.selector}</code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-3">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Errors</h3>
          </div>
          <div className="space-y-2">
            {result.errors.map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="card">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Warnings</h3>
          </div>
          <div className="space-y-2">
            {result.warnings.map((warning, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
        <div className="space-y-2 text-sm text-gray-600">
          {result.success && result.applyButtonFound && result.formFields.length > 0 ? (
            <>
              <p>✅ Job page detection completed successfully!</p>
              <p>• Apply button found and can be clicked</p>
              <p>• Form fields detected and ready for automation</p>
              <p>• Ready for Phase 7: Auto-filling forms</p>
            </>
          ) : (
            <>
              <p>⚠️ Some issues detected:</p>
              {!result.applyButtonFound && <p>• Apply button not found - check if URL is correct</p>}
              {result.formFields.length === 0 && <p>• No form fields detected - may need to click apply first</p>}
              <p>• Review errors and warnings above</p>
              <p>• Try adjusting automation settings</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectionReport;
