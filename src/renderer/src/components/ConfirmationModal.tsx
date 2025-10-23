import React, { useState } from 'react';
import { X, Check, Edit3, Eye, AlertCircle, FileText, User, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { FieldMapping, FillResult } from '@shared/types';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FieldMapping[]) => void;
  fillResult: FillResult;
}

const ConfirmationModal = ({ isOpen, onClose, onSubmit, fillResult }: ConfirmationModalProps) => {
  const [editableData, setEditableData] = useState<FieldMapping[]>(fillResult.filledFields);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleValueChange = (index: number, newValue: string) => {
    const updated = [...editableData];
    updated[index] = { ...updated[index], value: newValue };
    setEditableData(updated);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(editableData);
      onClose();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldIcon = (profileField: string) => {
    switch (profileField) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'linkedin': return <ExternalLink className="w-4 h-4" />;
      case 'portfolio': return <ExternalLink className="w-4 h-4" />;
      case 'resume': return <FileText className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getFieldTypeColor = (profileField: string) => {
    switch (profileField) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'phone': return 'bg-green-100 text-green-800';
      case 'location': return 'bg-purple-100 text-purple-800';
      case 'linkedin': return 'bg-blue-100 text-blue-800';
      case 'portfolio': return 'bg-orange-100 text-orange-800';
      case 'resume': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Check className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Review Application</h2>
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
          {/* Summary */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center mb-2">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="font-medium text-green-800">Auto-Fill Complete</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700">
              <div>
                <span className="font-medium">Fields Filled:</span> {fillResult.filledFields.length}
              </div>
              <div>
                <span className="font-medium">Unfilled:</span> {fillResult.unfilledFields.length}
              </div>
              <div>
                <span className="font-medium">Errors:</span> {fillResult.errors.length}
              </div>
              <div>
                <span className="font-medium">Warnings:</span> {fillResult.warnings.length}
              </div>
            </div>
          </div>

          {/* Filled Fields */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filled Fields</h3>
            <div className="space-y-3">
              {editableData.map((mapping, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {getFieldIcon(mapping.profileField)}
                      <span className="ml-2 font-medium text-gray-900">
                        {mapping.detectedField.name || mapping.detectedField.id || 'Unnamed Field'}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getFieldTypeColor(mapping.profileField)}`}>
                        {mapping.profileField}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="mr-2">Confidence:</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${mapping.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2">{Math.round(mapping.confidence * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={mapping.value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      className="flex-1 input-field"
                      placeholder="Enter value..."
                    />
                    <button
                      onClick={() => {
                        // In a real implementation, this would open the field in the browser for editing
                        alert('Field editing in browser not implemented yet');
                      }}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </div>
                  
                  {mapping.detectedField.label && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Label:</span> {mapping.detectedField.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Unfilled Fields */}
          {fillResult.unfilledFields.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Unfilled Fields</h3>
              <div className="space-y-2">
                {fillResult.unfilledFields.map((field, index) => (
                  <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">
                        {field.name || field.id || 'Unnamed Field'}
                      </span>
                      <span className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                        {field.type}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      These fields could not be automatically filled and may require manual input.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {fillResult.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Errors</h3>
              <div className="space-y-2">
                {fillResult.errors.map((error, index) => (
                  <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-red-800">{error}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {fillResult.warnings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Warnings</h3>
              <div className="space-y-2">
                {fillResult.warnings.map((warning, index) => (
                  <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                      <span className="text-yellow-800">{warning}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          {fillResult.screenshots.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Screenshots</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fillResult.screenshots.map((screenshot, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        Screenshot {index + 1}
                      </span>
                      <button
                        onClick={() => {
                          // Open screenshot in default image viewer
                          window.electronAPI.openResume(screenshot).catch(console.error);
                        }}
                        className="btn-secondary text-sm flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {screenshot.split('/').pop()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
