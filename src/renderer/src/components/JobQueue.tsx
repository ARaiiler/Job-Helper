import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit3, Trash2, Save, Search, Filter, ExternalLink, Play, Settings, CheckSquare, Square } from 'lucide-react';
import { Job, JobStatus, BatchSettings, JobBoardProfile } from '@shared/types';
import BatchSettingsModal from './BatchSettingsModal';
import BatchProgressModal from './BatchProgressModal';
import BatchResultsDashboard from './BatchResultsDashboard';

const JobQueue = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [showBatchSettings, setShowBatchSettings] = useState(false);
  const [showBatchProgress, setShowBatchProgress] = useState(false);
  const [showBatchResults, setShowBatchResults] = useState(false);
  const [batchSessionId, setBatchSessionId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any>(null);
  const [jobBoardProfiles, setJobBoardProfiles] = useState<JobBoardProfile[]>([]);

  const [formData, setFormData] = useState<Job>({
    company: '',
    position: '',
    job_url: '',
    description: '',
    status: 'queued',
    notes: ''
  });

  const statusOptions: { value: JobStatus | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All Jobs', color: 'bg-gray-100 text-gray-800' },
    { value: 'queued', label: 'Queued', color: 'bg-blue-100 text-blue-800' },
    { value: 'applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interviewing', label: 'Interviewing', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' }
  ];

  useEffect(() => {
    loadJobs();
    loadJobBoardProfiles();
  }, []);

  const loadJobBoardProfiles = async () => {
    try {
      const profiles = await window.electronAPI.getJobBoardProfiles();
      setJobBoardProfiles(profiles);
    } catch (error) {
      console.error('Failed to load job board profiles:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const data = await window.electronAPI.getAllJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
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
        const updated = await window.electronAPI.saveJob({ ...formData, id: editingId });
        setJobs(prev => prev.map(job => job.id === editingId ? updated : job));
        setEditingId(null);
      } else {
        const newJob = await window.electronAPI.saveJob(formData);
        setJobs(prev => [...prev, newJob]);
        setIsAdding(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Failed to save job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await window.electronAPI.deleteJob(id);
      setJobs(prev => prev.filter(job => job.id !== id));
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleEdit = (job: Job) => {
    setFormData(job);
    setEditingId(job.id!);
    setIsAdding(false);
  };

  const resetForm = () => {
    setFormData({
      company: '',
      position: '',
      job_url: '',
      description: '',
      status: 'queued',
      notes: ''
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: JobStatus) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  const handleSelectJob = (jobId: number) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    const filteredJobs = getFilteredJobs();
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.id!));
    }
  };

  const handleBatchProcess = () => {
    if (selectedJobs.length === 0) {
      alert('Please select jobs to process');
      return;
    }
    setShowBatchSettings(true);
  };

  const handleStartBatch = async (settings: BatchSettings) => {
    try {
      const sessionId = await window.electronAPI.startBatchSession(selectedJobs, settings);
      setBatchSessionId(sessionId);
      setShowBatchSettings(false);
      setShowBatchProgress(true);
      
      // Start polling for progress
      const pollProgress = setInterval(async () => {
        try {
          const progress = await window.electronAPI.getBatchProgress(sessionId);
          setBatchProgress(progress);
          
          if (progress.progress_percentage >= 100) {
            clearInterval(pollProgress);
            const results = await window.electronAPI.getBatchResults(sessionId);
            setBatchResults(results);
            setShowBatchProgress(false);
            setShowBatchResults(true);
          }
        } catch (error) {
          console.error('Failed to get batch progress:', error);
          clearInterval(pollProgress);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Failed to start batch processing:', error);
      alert('Failed to start batch processing');
    }
  };

  const handlePauseBatch = async () => {
    if (batchSessionId) {
      await window.electronAPI.pauseBatchSession(batchSessionId);
    }
  };

  const handleResumeBatch = async () => {
    if (batchSessionId) {
      await window.electronAPI.resumeBatchSession(batchSessionId);
    }
  };

  const handleStopBatch = async () => {
    if (batchSessionId) {
      await window.electronAPI.stopBatchSession(batchSessionId);
      setShowBatchProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Briefcase className="w-6 h-6 text-primary-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Job Queue</h1>
        </div>
        <div className="flex items-center space-x-3">
          {selectedJobs.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedJobs.length} selected
              </span>
              <button
                onClick={handleBatchProcess}
                className="btn-primary flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Batch Process
              </button>
            </div>
          )}
          {!isAdding && !editingId && (
            <button
              onClick={() => {
                setIsAdding(true);
                resetForm();
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Job
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by company or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
              className="input-field"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="label">Position *</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className={`input-field ${errors.position ? 'border-red-500' : ''}`}
                  placeholder="Job title"
                />
                {errors.position && <p className="text-red-500 text-sm mt-1">{errors.position}</p>}
              </div>

              <div>
                <label className="label">Job URL</label>
                <input
                  type="url"
                  name="job_url"
                  value={formData.job_url}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="https://company.com/job-posting"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  {statusOptions.slice(1).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Job Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input-field"
                rows={4}
                placeholder="Paste the job description here..."
              />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                rows={2}
                placeholder="Personal notes about this job..."
              />
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
                {loading ? 'Saving...' : 'Save Job'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="card text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {jobs.length === 0 ? 'No jobs added yet' : 'No jobs match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {jobs.length === 0 
                ? 'Click "Add Job" to start tracking your applications'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => setIsAdding(true)}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Job
              </button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id!)}
                    onChange={() => handleSelectJob(job.id!)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.position}</h3>
                    <div className="flex items-center space-x-2">
                      {job.match_score !== undefined && (
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-600">Match:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.match_score >= 80 ? 'bg-green-100 text-green-800' :
                            job.match_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {job.match_score}%
                          </span>
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {statusOptions.find(opt => opt.value === job.status)?.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-primary-600 font-medium mb-2">{job.company}</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Added: {formatDate(job.date_added || job.created_at || '')}
                  </p>
                  
                  {job.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-700 line-clamp-2">{job.description}</p>
                    </div>
                  )}
                  
                  {job.notes && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 italic">"{job.notes}"</p>
                    </div>
                  )}
                  
                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Job Posting
                    </a>
                  )}
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(job)}
                    className="text-primary-600 hover:text-primary-700"
                    title="Edit job"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id!)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Batch Processing Modals */}
      <BatchSettingsModal
        isOpen={showBatchSettings}
        onClose={() => setShowBatchSettings(false)}
        onSave={handleStartBatch}
        availableBoards={jobBoardProfiles}
      />

      <BatchProgressModal
        isOpen={showBatchProgress}
        onClose={() => setShowBatchProgress(false)}
        progress={batchProgress}
        onPause={handlePauseBatch}
        onResume={handleResumeBatch}
        onStop={handleStopBatch}
      />

      {batchResults && (
        <BatchResultsDashboard
          session={batchProgress?.session || {}}
          results={batchResults}
          onClose={() => setShowBatchResults(false)}
          onExportResults={() => {
            // Export functionality would go here
            console.log('Exporting results...');
          }}
        />
      )}
    </div>
  );
};

export default JobQueue;
