import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { WorkExperience as WorkExperienceType } from '@shared/types';

const WorkExperience = () => {
  const [experiences, setExperiences] = useState<WorkExperienceType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<WorkExperienceType>({
    company: '',
    title: '',
    start_date: '',
    end_date: '',
    description: '',
    achievements: []
  });

  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      const data = await window.electronAPI.getAllWorkExperience();
      setExperiences(data);
    } catch (error) {
      console.error('Failed to load work experience:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const updated = await window.electronAPI.saveWorkExperience({ ...formData, id: editingId });
        setExperiences(prev => prev.map(exp => exp.id === editingId ? updated : exp));
        setEditingId(null);
      } else {
        const newExp = await window.electronAPI.saveWorkExperience(formData);
        setExperiences(prev => [...prev, newExp]);
        setIsAdding(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save work experience:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this work experience?')) {
      return;
    }

    try {
      await window.electronAPI.deleteWorkExperience(id);
      setExperiences(prev => prev.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Failed to delete work experience:', error);
    }
  };

  const handleEdit = (experience: WorkExperienceType) => {
    setFormData(experience);
    setEditingId(experience.id!);
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      company: '',
      title: '',
      start_date: '',
      end_date: '',
      description: '',
      achievements: []
    });
    setNewAchievement('');
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, newAchievement.trim()]
      }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Briefcase className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Company *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`input-field ${errors.company ? 'border-red-500' : ''}`}
                placeholder="Company name"
              />
              {errors.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
            </div>

            <div>
              <label className="label">Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Your job title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`input-field ${errors.start_date ? 'border-red-500' : ''}`}
              />
              {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
            </div>

            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty if current position</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows={3}
              placeholder="Brief description of your role and responsibilities"
            />
          </div>

          <div className="mb-4">
            <label className="label">Key Achievements</label>
            <div className="space-y-2">
              {formData.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 flex-1">{achievement}</span>
                  <button
                    type="button"
                    onClick={() => removeAchievement(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add an achievement"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Experience'}
            </button>
          </div>
        </form>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No work experience added yet</p>
            <p className="text-sm">Click "Add Experience" to get started</p>
          </div>
        ) : (
          experiences.map((experience) => (
            <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{experience.title}</h3>
                  <p className="text-primary-600 font-medium">{experience.company}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(experience.start_date)} - {experience.end_date ? formatDate(experience.end_date) : 'Present'}
                  </p>
                  
                  {experience.description && (
                    <p className="text-gray-700 mt-2">{experience.description}</p>
                  )}
                  
                  {experience.achievements.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Achievements:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {experience.achievements.map((achievement, index) => (
                          <li key={index} className="text-sm text-gray-700">{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(experience)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(experience.id!)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkExperience;
