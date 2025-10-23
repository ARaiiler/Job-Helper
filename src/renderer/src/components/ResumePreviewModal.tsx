import React, { useState } from 'react';
import { X, Save, Edit3, Check, XCircle } from 'lucide-react';
import { TailoredContent, ResumePreview } from '@shared/types';

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: TailoredContent) => void;
  tailoredContent: TailoredContent;
  preview: ResumePreview;
}

const ResumePreviewModal = ({ isOpen, onClose, onSave, tailoredContent, preview }: ResumePreviewModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<TailoredContent>(tailoredContent);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedContent);
    onClose();
  };

  const handleEdit = (type: 'experiences' | 'achievements' | 'skills' | 'summary', index: number, field: 'original' | 'tailored', value: string) => {
    const updated = { ...editedContent };
    
    if (type === 'experiences') {
      updated.selected_experiences[index] = {
        ...updated.selected_experiences[index],
        [field]: value
      };
    } else if (type === 'achievements') {
      updated.rewritten_achievements[index] = {
        ...updated.rewritten_achievements[index],
        [field]: value
      };
    } else if (type === 'skills') {
      updated.skills_to_highlight[index] = value;
    } else if (type === 'summary') {
      updated.custom_summary = value;
    }
    
    setEditedContent(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Resume Preview</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-secondary flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? 'View Mode' : 'Edit Mode'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Content */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Content</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Professional Summary</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                    Your original professional summary would appear here...
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Work Experience</h4>
                  <div className="space-y-2">
                    {editedContent.selected_experiences.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">{exp.original}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tailored Content */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tailored Content</h3>
              <div className="space-y-4">
                {/* Custom Summary */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Professional Summary</h4>
                  {isEditing ? (
                    <textarea
                      value={editedContent.custom_summary}
                      onChange={(e) => handleEdit('summary', 0, 'tailored', e.target.value)}
                      className="input-field"
                      rows={3}
                    />
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-sm text-green-800">{editedContent.custom_summary}</p>
                    </div>
                  )}
                </div>

                {/* Selected Experiences */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Selected Experiences</h4>
                  <div className="space-y-2">
                    {editedContent.selected_experiences.map((exp, index) => (
                      <div key={index} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-600">Tailored Version:</label>
                              <textarea
                                value={exp.tailored}
                                onChange={(e) => handleEdit('experiences', index, 'tailored', e.target.value)}
                                className="input-field text-sm"
                                rows={2}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-green-800">{exp.tailored}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewritten Achievements */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Key Achievements</h4>
                  <div className="space-y-2">
                    {editedContent.rewritten_achievements.map((achievement, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-gray-600">Tailored Achievement:</label>
                              <textarea
                                value={achievement.tailored}
                                onChange={(e) => handleEdit('achievements', index, 'tailored', e.target.value)}
                                className="input-field text-sm"
                                rows={2}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-blue-800">{achievement.tailored}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills to Highlight */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Skills to Highlight</h4>
                  <div className="flex flex-wrap gap-2">
                    {editedContent.skills_to_highlight.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Changes Summary */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">Changes Made</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {preview.changes.map((change, index) => (
                <li key={index} className="flex items-center">
                  {change.type === 'added' && <Check className="w-3 h-3 text-green-600 mr-2" />}
                  {change.type === 'modified' && <Edit3 className="w-3 h-3 text-blue-600 mr-2" />}
                  {change.type === 'removed' && <XCircle className="w-3 h-3 text-red-600 mr-2" />}
                  {change.content}
                </li>
              ))}
            </ul>
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
            <Save className="w-4 h-4 mr-2" />
            Save Tailored Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal;
