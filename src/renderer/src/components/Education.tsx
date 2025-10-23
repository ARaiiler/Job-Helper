import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { Education as EducationType } from '@shared/types';

const Education = () => {
  const [educations, setEducations] = useState<EducationType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<EducationType>({
    institution: '',
    degree: '',
    field: '',
    start_date: '',
    end_date: '',
    gpa: undefined
  });

  useEffect(() => {
    loadEducations();
  }, []);

  const loadEducations = async () => {
    try {
      const data = await window.electronAPI.getAllEducation();
      setEducations(data);
    } catch (error) {
      console.error('Failed to load education:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    }

    if (!formData.degree.trim()) {
      newErrors.degree = 'Degree is required';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (formData.gpa && (formData.gpa < 0 || formData.gpa > 4)) {
      newErrors.gpa = 'GPA must be between 0 and 4';
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
        const updated = await window.electronAPI.saveEducation({ ...formData, id: editingId });
        setEducations(prev => prev.map(edu => edu.id === editingId ? updated : edu));
        setEditingId(null);
      } else {
        const newEdu = await window.electronAPI.saveEducation(formData);
        setEducations(prev => [...prev, newEdu]);
        setIsAdding(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save education:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this education entry?')) {
      return;
    }

    try {
      await window.electronAPI.deleteEducation(id);
      setEducations(prev => prev.filter(edu => edu.id !== id));
    } catch (error) {
      console.error('Failed to delete education:', error);
    }
  };

  const handleEdit = (education: EducationType) => {
    setFormData(education);
    setEditingId(education.id!);
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      institution: '',
      degree: '',
      field: '',
      start_date: '',
      end_date: '',
      gpa: undefined
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseFloat(value) : undefined) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
          <GraduationCap className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Education</h2>
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
            Add Education
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Institution *</label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className={`input-field ${errors.institution ? 'border-red-500' : ''}`}
                placeholder="University or school name"
              />
              {errors.institution && <p className="text-red-500 text-sm mt-1">{errors.institution}</p>}
            </div>

            <div>
              <label className="label">Degree *</label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                className={`input-field ${errors.degree ? 'border-red-500' : ''}`}
                placeholder="Bachelor's, Master's, etc."
              />
              {errors.degree && <p className="text-red-500 text-sm mt-1">{errors.degree}</p>}
            </div>

            <div>
              <label className="label">Field of Study</label>
              <input
                type="text"
                name="field"
                value={formData.field}
                onChange={handleChange}
                className="input-field"
                placeholder="Computer Science, Business, etc."
              />
            </div>

            <div>
              <label className="label">GPA</label>
              <input
                type="number"
                name="gpa"
                value={formData.gpa || ''}
                onChange={handleChange}
                min="0"
                max="4"
                step="0.01"
                className={`input-field ${errors.gpa ? 'border-red-500' : ''}`}
                placeholder="3.5"
              />
              {errors.gpa && <p className="text-red-500 text-sm mt-1">{errors.gpa}</p>}
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
              <p className="text-xs text-gray-500 mt-1">Leave empty if currently enrolled</p>
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
              {loading ? 'Saving...' : 'Save Education'}
            </button>
          </div>
        </form>
      )}

      {/* Education List */}
      <div className="space-y-4">
        {educations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No education entries added yet</p>
            <p className="text-sm">Click "Add Education" to get started</p>
          </div>
        ) : (
          educations.map((education) => (
            <div key={education.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{education.degree}</h3>
                  <p className="text-primary-600 font-medium">{education.institution}</p>
                  {education.field && (
                    <p className="text-sm text-gray-600">{education.field}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {formatDate(education.start_date)} - {education.end_date ? formatDate(education.end_date) : 'Present'}
                  </p>
                  {education.gpa && (
                    <p className="text-sm text-gray-600 mt-1">GPA: {education.gpa}</p>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(education)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(education.id!)}
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

export default Education;
