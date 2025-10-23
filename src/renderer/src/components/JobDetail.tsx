import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Trash2, Save, X, ExternalLink, Calendar, FileText, Brain, Target, AlertCircle, FileEdit, Check, Download, Eye, Play, Settings, Zap, Shield } from 'lucide-react';
import { Job, Application, JobStatus, ApplicationStatus, JobAnalysis, ProfileMatch, TailoredContent, ResumePreview, PDFSettings, DetectionResult, AutomationSettings, FillResult, FieldMapping, CaptchaDetection, ManualAssistSession } from '@shared/types';
import ResumePreviewModal from './ResumePreviewModal';
import PDFSettingsComponent from './PDFSettings';
import AutomationSettingsComponent from './AutomationSettings';
import DetectionReport from './DetectionReport';
import ConfirmationModal from './ConfirmationModal';
import CaptchaAlert from './CaptchaAlert';
import ManualAssist from './ManualAssist';

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingApplication, setIsAddingApplication] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCalculatingMatch, setIsCalculatingMatch] = useState(false);
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [profileMatch, setProfileMatch] = useState<ProfileMatch | null>(null);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [tailoredContent, setTailoredContent] = useState<TailoredContent | null>(null);
  const [resumePreview, setResumePreview] = useState<ResumePreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfSettings, setPdfSettings] = useState<PDFSettings>({
    template: 'modern-clean',
    font: 'sans-serif',
    colorScheme: 'professional',
    fontSize: 'medium'
  });
  const [showPDFSettings, setShowPDFSettings] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>({
    headless: true,
    timeout: 30000,
    screenshotDirectory: '',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  const [showAutomationSettings, setShowAutomationSettings] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [fillResult, setFillResult] = useState<FillResult | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaDetection, setCaptchaDetection] = useState<CaptchaDetection | null>(null);
  const [isDetectingCaptcha, setIsDetectingCaptcha] = useState(false);
  const [showManualAssist, setShowManualAssist] = useState(false);
  const [manualAssistSessions, setManualAssistSessions] = useState<ManualAssistSession[]>([]);

  const [formData, setFormData] = useState<Job>({
    company: '',
    position: '',
    job_url: '',
    description: '',
    status: 'queued',
    notes: ''
  });

  const [applicationData, setApplicationData] = useState<Application>({
    job_id: parseInt(id || '0'),
    applied_date: new Date().toISOString().split('T')[0],
    status: 'applied',
    tailored_resume_path: ''
  });

  const statusOptions: { value: JobStatus; label: string; color: string }[] = [
    { value: 'queued', label: 'Queued', color: 'bg-blue-100 text-blue-800' },
    { value: 'applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interviewing', label: 'Interviewing', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' }
  ];

  const applicationStatusOptions: { value: ApplicationStatus; label: string; color: string }[] = [
    { value: 'applied', label: 'Applied', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'interviewing', label: 'Interviewing', color: 'bg-purple-100 text-purple-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' }
  ];

  useEffect(() => {
    if (id) {
      loadJobData();
    }
  }, [id]);

  const loadJobData = async () => {
    try {
      const [jobData, applicationsData] = await Promise.all([
        window.electronAPI.getJobById(parseInt(id!)),
        window.electronAPI.getApplicationsByJob(parseInt(id!))
      ]);
      setJob(jobData);
      setApplications(applicationsData);
      if (jobData) {
        setFormData(jobData);
        setAnalysis(jobData.analysis_data || null);
        if (jobData.match_score !== undefined) {
          // We'll need to recalculate the full match data
          setProfileMatch({
            overall_score: jobData.match_score,
            skills_match: 0,
            experience_match: 0,
            keyword_match: 0,
            missing_skills: [],
            matched_skills: []
          });
        }
      }
    } catch (error) {
      console.error('Failed to load job data:', error);
    } finally {
      setLoading(false);
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

  const handleJobUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const updatedJob = await window.electronAPI.saveJob({ ...formData, id: job?.id });
      setJob(updatedJob);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update job:', error);
    }
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newApplication = await window.electronAPI.saveApplication(applicationData);
      setApplications(prev => [...prev, newApplication]);
      setIsAddingApplication(false);
      setApplicationData({
        job_id: parseInt(id!),
        applied_date: new Date().toISOString().split('T')[0],
        status: 'applied',
        tailored_resume_path: ''
      });
    } catch (error) {
      console.error('Failed to save application:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job? This will also delete all associated applications.')) {
      return;
    }

    try {
      await window.electronAPI.deleteJob(job?.id!);
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleApplicationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnalyzeJob = async () => {
    if (!job?.description) {
      alert('Job description is required for analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysisData = await window.electronAPI.analyzeJob(job.id!);
      setAnalysis(analysisData);
      
      // Reload job data to get updated analysis
      const updatedJob = await window.electronAPI.getJobById(job.id!);
      setJob(updatedJob);
    } catch (error) {
      console.error('Job analysis failed:', error);
      alert('Analysis failed. Please check your API key in Settings.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCalculateMatch = async () => {
    if (!job) return;

    setIsCalculatingMatch(true);
    try {
      const matchData = await window.electronAPI.calculateMatch(job.id!);
      setProfileMatch(matchData);
      
      // Reload job data to get updated match score
      const updatedJob = await window.electronAPI.getJobById(job.id!);
      setJob(updatedJob);
    } catch (error) {
      console.error('Match calculation failed:', error);
      alert('Match calculation failed. Please ensure your profile is complete.');
    } finally {
      setIsCalculatingMatch(false);
    }
  };

  const handleGenerateTailoredResume = async () => {
    if (!job) return;

    setIsGeneratingResume(true);
    try {
      const tailored = await window.electronAPI.generateTailoredResume(job.id!);
      setTailoredContent(tailored);
      
      // Generate preview
      const preview = await window.electronAPI.previewResume(job.id!, tailored);
      setResumePreview(preview);
      
      // Show preview modal
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Resume generation failed:', error);
      alert('Resume generation failed. Please check your API key and try again.');
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const handleSaveTailoredContent = async (content: TailoredContent) => {
    try {
      // Find the most recent application for this job
      const recentApplication = applications[0];
      if (recentApplication) {
        await window.electronAPI.saveTailoredContent(recentApplication.id!, content);
        setTailoredContent(content);
      } else {
        // Create a new application if none exists
        const newApplication = await window.electronAPI.saveApplication({
          job_id: job!.id!,
          applied_date: new Date().toISOString().split('T')[0],
          status: 'applied',
          tailored_content: content
        });
        setApplications(prev => [newApplication, ...prev]);
      }
    } catch (error) {
      console.error('Failed to save tailored content:', error);
      alert('Failed to save tailored content. Please try again.');
    }
  };

  const handleGeneratePDF = async () => {
    if (!applications.length) {
      alert('No application found. Please create an application first.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filePath = await window.electronAPI.generateResume(applications[0].id!, pdfSettings);
      alert(`Resume PDF generated successfully! Saved to: ${filePath}`);
      
      // Reload applications to get updated PDF path
      const updatedApplications = await window.electronAPI.getApplicationsByJob(job!.id!);
      setApplications(updatedApplications);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please ensure you have generated tailored content first.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleViewResume = async (filePath: string) => {
    try {
      await window.electronAPI.openResume(filePath);
    } catch (error) {
      console.error('Failed to open resume:', error);
      alert('Failed to open resume. The file may not exist.');
    }
  };

  const handlePDFSettingsChange = (settings: PDFSettings) => {
    setPdfSettings(settings);
  };

  const handleDetectJobPage = async () => {
    if (!job || !job.job_url) {
      alert('Job URL is required for automation detection.');
      return;
    }

    setIsDetecting(true);
    try {
      const result = await window.electronAPI.detectJobPage(job.id!);
      setDetectionResult(result);
    } catch (error) {
      console.error('Job page detection failed:', error);
      alert('Job page detection failed. Please check the URL and try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleAutomationSettingsChange = (settings: AutomationSettings) => {
    setAutomationSettings(settings);
  };

  const handleViewScreenshot = (path: string) => {
    // Open screenshot in default image viewer
    window.electronAPI.openResume(path).catch(console.error);
  };

  const handleAutoFill = async () => {
    if (!job || !job.job_url) {
      alert('Job URL is required for auto-fill.');
      return;
    }

    setIsAutoFilling(true);
    try {
      const result = await window.electronAPI.autoFillForm(job.id!, applications[0]?.id);
      setFillResult(result);
      
      if (result.success) {
        setShowConfirmationModal(true);
      } else {
        alert('Auto-fill failed. Please check the errors and try again.');
      }
    } catch (error) {
      console.error('Auto-fill failed:', error);
      alert('Auto-fill failed. Please check your profile and try again.');
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSubmitApplication = async (confirmData: FieldMapping[]) => {
    if (!applications.length) {
      alert('No application found. Please create an application first.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = await window.electronAPI.submitApplication(job!.id!, applications[0].id!, confirmData);
      alert(`Application submitted successfully!`);
      
      // Reload job and applications to get updated status
      const updatedJob = await window.electronAPI.getJobById(job!.id!);
      setJob(updatedJob);
      
      const updatedApplications = await window.electronAPI.getApplicationsByJob(job!.id!);
      setApplications(updatedApplications);
      
      setShowConfirmationModal(false);
    } catch (error) {
      console.error('Application submission failed:', error);
      alert('Application submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetectCaptcha = async () => {
    if (!job || !job.job_url) {
      alert('Job URL is required for CAPTCHA detection.');
      return;
    }

    setIsDetectingCaptcha(true);
    try {
      const detection = await window.electronAPI.detectCaptcha(job.id!);
      setCaptchaDetection(detection);
      
      if (detection.detected) {
        // Automatically show manual assist if CAPTCHA detected
        setShowManualAssist(true);
      }
    } catch (error) {
      console.error('CAPTCHA detection failed:', error);
      alert('CAPTCHA detection failed. Please try again.');
    } finally {
      setIsDetectingCaptcha(false);
    }
  };

  const handleManualAssistSessionCreated = (session: ManualAssistSession) => {
    setManualAssistSessions(prev => [session, ...prev]);
  };

  const loadManualAssistSessions = async () => {
    if (!job) return;
    
    try {
      const sessions = await window.electronAPI.getManualAssistSessions(job.id!);
      setManualAssistSessions(sessions);
    } catch (error) {
      console.error('Failed to load manual assist sessions:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: JobStatus | ApplicationStatus) => {
    const statusOption = [...statusOptions, ...applicationStatusOptions].find(opt => opt.value === status);
    return statusOption?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
          <p className="text-gray-600 mb-6">The job you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="btn-primary"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/jobs')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.position}</h1>
            <p className="text-primary-600 font-medium">{job.company}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Job
            </button>
          )}
          <button
            onClick={handleDelete}
            className="btn-danger flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Job Status */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Job Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {statusOptions.find(opt => opt.value === job.status)?.label}
            </span>
          </div>
          {job.job_url && (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Job Posting
            </a>
          )}
        </div>
      </div>

      {/* AI Analysis Section */}
      {job.description && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Brain className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">AI Analysis</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAnalyzeJob}
                disabled={isAnalyzing}
                className="btn-secondary flex items-center"
              >
                {isAnalyzing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Job'}
              </button>
              {analysis && (
                <button
                  onClick={handleCalculateMatch}
                  disabled={isCalculatingMatch}
                  className="btn-primary flex items-center"
                >
                  {isCalculatingMatch ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Target className="w-4 h-4 mr-2" />
                  )}
                  {isCalculatingMatch ? 'Calculating...' : 'Calculate Match'}
                </button>
              )}
            </div>
          </div>

          {analysis ? (
            <div className="space-y-4">
              {/* Profile Match Score */}
              {profileMatch && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Profile Match Score</h3>
                    <div className="text-2xl font-bold text-primary-600">
                      {profileMatch.overall_score}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${profileMatch.overall_score}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Skills:</span>
                      <span className="ml-1 font-medium">{profileMatch.skills_match}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Experience:</span>
                      <span className="ml-1 font-medium">{profileMatch.experience_match}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Keywords:</span>
                      <span className="ml-1 font-medium">{profileMatch.keyword_match}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.required_skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Preferred Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.preferred_skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Experience Level</h4>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    {analysis.experience_level}
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">ATS Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.ats_keywords.slice(0, 5).map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {keyword}
                      </span>
                    ))}
                    {analysis.ats_keywords.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{analysis.ats_keywords.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Missing Skills */}
              {profileMatch && profileMatch.missing_skills.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                    <h4 className="font-medium text-yellow-800">Missing Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileMatch.missing_skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Responsibilities */}
              {analysis.key_responsibilities.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Key Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {analysis.key_responsibilities.map((responsibility, index) => (
                      <li key={index}>{responsibility}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No analysis available</p>
              <p className="text-sm">Click "Analyze Job" to get AI insights</p>
            </div>
          )}
        </div>
      )}

      {/* Resume Tailoring Section */}
      {analysis && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileEdit className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Resume Tailoring</h2>
            </div>
            <button
              onClick={handleGenerateTailoredResume}
              disabled={isGeneratingResume}
              className="btn-primary flex items-center"
            >
              {isGeneratingResume ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <FileEdit className="w-4 h-4 mr-2" />
              )}
              {isGeneratingResume ? 'Generating...' : 'Generate Tailored Resume'}
            </button>
          </div>

          {tailoredContent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Check className="w-4 h-4 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-800">Tailored Resume Generated</h3>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Your resume has been customized for this specific job. Review and edit the content before saving.
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="btn-secondary text-sm"
                  >
                    Preview & Edit
                  </button>
                  <button
                    onClick={() => handleSaveTailoredContent(tailoredContent)}
                    className="btn-primary text-sm"
                  >
                    Save Tailored Content
                  </button>
                </div>
              </div>

              {/* Quick Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Custom Summary</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {tailoredContent.custom_summary}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Skills to Highlight</h4>
                  <div className="flex flex-wrap gap-2">
                    {tailoredContent.skills_to_highlight.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileEdit className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tailored resume generated yet</p>
              <p className="text-sm">Click "Generate Tailored Resume" to create job-specific content</p>
            </div>
          )}
        </div>
      )}

      {/* PDF Generation Section */}
      {tailoredContent && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Download className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">PDF Resume</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPDFSettings(!showPDFSettings)}
                className="btn-secondary text-sm"
              >
                Settings
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="btn-primary flex items-center"
              >
                {isGeneratingPDF ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isGeneratingPDF ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>

          {/* PDF Settings */}
          {showPDFSettings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <PDFSettingsComponent onSettingsChange={handlePDFSettingsChange} />
            </div>
          )}

          {/* Generated PDFs */}
          {applications.some(app => app.tailored_resume_path) && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Generated Resumes</h3>
              {applications
                .filter(app => app.tailored_resume_path)
                .map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-green-800">
                          {job?.company} - {job?.position}
                        </p>
                        <p className="text-sm text-green-600">
                          Generated on {formatDate(app.applied_date || '')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewResume(app.tailored_resume_path!)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </button>
                  </div>
                ))}
            </div>
          )}

          {!applications.some(app => app.tailored_resume_path) && (
            <div className="text-center py-8 text-gray-500">
              <Download className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No PDF resume generated yet</p>
              <p className="text-sm">Click "Generate PDF" to create a professional resume</p>
            </div>
          )}
        </div>
      )}

      {/* Browser Automation Section */}
      {job && job.job_url && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Play className="w-5 h-5 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Browser Automation</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowAutomationSettings(!showAutomationSettings)}
                className="btn-secondary text-sm flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={handleDetectJobPage}
                disabled={isDetecting}
                className="btn-primary flex items-center"
              >
                {isDetecting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isDetecting ? 'Detecting...' : 'Detect Job Page'}
              </button>
            </div>
          </div>

          {/* Automation Settings */}
          {showAutomationSettings && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <AutomationSettingsComponent onSettingsChange={handleAutomationSettingsChange} />
            </div>
          )}

          {/* Detection Results */}
          {detectionResult && (
            <div className="mt-6">
              <DetectionReport 
                result={detectionResult} 
                onViewScreenshot={handleViewScreenshot}
              />
            </div>
          )}

          {/* Auto-Fill Section */}
          {detectionResult && detectionResult.success && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Zap className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-800">Ready for Auto-Fill</h3>
                </div>
                <button
                  onClick={handleAutoFill}
                  disabled={isAutoFilling}
                  className="btn-primary flex items-center"
                >
                  {isAutoFilling ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {isAutoFilling ? 'Auto-Filling...' : 'Auto-Fill Form'}
                </button>
              </div>
              <p className="text-sm text-blue-700">
                Form fields have been detected. Click "Auto-Fill Form" to automatically populate the application with your profile data.
              </p>
            </div>
          )}

          {/* Fill Results */}
          {fillResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-medium text-green-800">Auto-Fill Complete</h3>
                </div>
                <div className="text-sm text-green-700">
                  {fillResult.filledFields.length} fields filled
                </div>
              </div>
              
              {fillResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-3">
                    Form has been automatically filled with your profile data. Review the results and submit when ready.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowConfirmationModal(true)}
                      className="btn-primary text-sm"
                    >
                      Review & Submit
                    </button>
                    <button
                      onClick={() => setFillResult(null)}
                      className="btn-secondary text-sm"
                    >
                      Clear Results
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700 mb-3">
                    Auto-fill encountered some issues. Please review the errors below.
                  </p>
                  {fillResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">• {error}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {!detectionResult && !isDetecting && (
            <div className="text-center py-8 text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No automation detection performed yet</p>
              <p className="text-sm">Click "Detect Job Page" to analyze the application form</p>
            </div>
          )}
        </div>
      )}

      {/* Resume Preview Modal */}
      {showPreviewModal && tailoredContent && resumePreview && (
        <ResumePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onSave={handleSaveTailoredContent}
          tailoredContent={tailoredContent}
          preview={resumePreview}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && fillResult && (
        <ConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          onSubmit={handleSubmitApplication}
          fillResult={fillResult}
        />
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="card">
          <form onSubmit={handleJobUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Company *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className={`input-field ${errors.company ? 'border-red-500' : ''}`}
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
                  {statusOptions.map(option => (
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
                rows={6}
              />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(job);
                  setErrors({});
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Job Description */}
      {job.description && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {job.description}
            </pre>
          </div>
        </div>
      )}

      {/* Notes */}
      {job.notes && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700">{job.notes}</p>
        </div>
      )}

      {/* Application History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Application History</h2>
          {!isAddingApplication && (
            <button
              onClick={() => setIsAddingApplication(true)}
              className="btn-primary flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Add Application
            </button>
          )}
        </div>

        {/* Add Application Form */}
        {isAddingApplication && (
          <form onSubmit={handleApplicationSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Application Date</label>
                <input
                  type="date"
                  name="applied_date"
                  value={applicationData.applied_date}
                  onChange={handleApplicationChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Status</label>
                <select
                  name="status"
                  value={applicationData.status}
                  onChange={handleApplicationChange}
                  className="input-field"
                >
                  {applicationStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="label">Resume Path (Optional)</label>
                <input
                  type="text"
                  name="tailored_resume_path"
                  value={applicationData.tailored_resume_path}
                  onChange={handleApplicationChange}
                  className="input-field"
                  placeholder="Path to tailored resume file"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={() => setIsAddingApplication(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Add Application
              </button>
            </div>
          </form>
        )}

        {/* Applications Timeline */}
        {applications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No applications recorded yet</p>
            <p className="text-sm">Add an application to track your progress</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Calendar className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Applied on {formatDate(application.applied_date || '')}
                      </p>
                      {application.tailored_resume_path && (
                        <p className="text-sm text-gray-600">
                          Resume: {application.tailored_resume_path}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {applicationStatusOptions.find(opt => opt.value === application.status)?.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetail;
