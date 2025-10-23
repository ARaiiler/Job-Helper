import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit3, Trash2, Save } from 'lucide-react';
import { Certification as CertificationType } from '@shared/types';

const Certifications = () => {
  const [certifications, setCertifications] = useState<CertificationType[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CertificationType>({
    name: '',
    issuer: '',
    date: '',
    credential_id: ''
  });

  useEffect(() => {
    loadCertifications();
  }, []);

  const loadCertifications = async () => {
    try {
      const data = await window.electronAPI.getAllCertifications();
      setCertifications(data);
    } catch (error) {
      console.error('Failed to load certifications:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Certification name is required';
    }

    if (!formData.issuer.trim()) {
      newErrors.issuer = 'Issuer is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
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
        const updated = await window.electronAPI.saveCertification({ ...formData, id: editingId });
        setCertifications(prev => prev.map(cert => cert.id === editingId ? updated : cert));
        setEditingId(null);
      } else {
        const newCert = await window.electronAPI.saveCertification(formData);
        setCertifications(prev => [...prev, newCert]);
        setIsAdding(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save certification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this certification?')) {
      return;
    }

    try {
      await window.electronAPI.deleteCertification(id);
      setCertifications(prev => prev.filter(cert => cert.id !== id));
    } catch (error) {
      console.error('Failed to delete certification:', error);
    }
  };

  const handleEdit = (certification: CertificationType) => {
    setFormData(certification);
    setEditingId(certification.id!);
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      issuer: '',
      date: '',
      credential_id: ''
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Award className="w-6 h-6 text-primary-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
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
            Add Certification
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Certification Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="AWS Certified Solutions Architect"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Issuer *</label>
              <input
                type="text"
                name="issuer"
                value={formData.issuer}
                onChange={handleChange}
                className={`input-field ${errors.issuer ? 'border-red-500' : ''}`}
                placeholder="Amazon Web Services"
              />
              {errors.issuer && <p className="text-red-500 text-sm mt-1">{errors.issuer}</p>}
            </div>

            <div>
              <label className="label">Date Obtained *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`input-field ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div>
              <label className="label">Credential ID</label>
              <input
                type="text"
                name="credential_id"
                value={formData.credential_id}
                onChange={handleChange}
                className="input-field"
                placeholder="Optional credential ID or verification code"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
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
              {loading ? 'Saving...' : 'Save Certification'}
            </button>
          </div>
        </form>
      )}

      {/* Certifications List */}
      <div className="space-y-4">
        {certifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No certifications added yet</p>
            <p className="text-sm">Click "Add Certification" to get started</p>
          </div>
        ) : (
          certifications.map((certification) => (
            <div key={certification.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{certification.name}</h3>
                  <p className="text-primary-600 font-medium">{certification.issuer}</p>
                  <p className="text-sm text-gray-600">
                    Obtained: {formatDate(certification.date)}
                  </p>
                  {certification.credential_id && (
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {certification.credential_id}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(certification)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(certification.id!)}
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

export default Certifications;
