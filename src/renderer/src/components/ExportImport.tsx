import React, { useState } from 'react';
import { Download, Upload, FileText, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { saveAs } from 'file-saver';

interface ExportImportProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportImport = ({ isOpen, onClose }: ExportImportProps) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage(null);

      let data: any;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case 'json':
          data = await window.electronAPI.exportAllData();
          filename = `job-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          data = await window.electronAPI.exportApplicationsCSV();
          filename = `applications-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        case 'pdf':
          data = await window.electronAPI.exportResumePDF();
          filename = `resume-${new Date().toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
          break;
        default:
          throw new Error('Invalid export format');
      }

      const blob = new Blob([data], { type: mimeType });
      saveAs(blob, filename);
      
      setMessage({ type: 'success', text: 'Export completed successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Export failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import.' });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);

      await window.electronAPI.importAllData(data);
      
      setMessage({ type: 'success', text: 'Import completed successfully!' });
      setImportFile(null);
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Import failed. Please check the file format.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setMessage(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Export & Import Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'export'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Export Data
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'import'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Import Data
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="json"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'json')}
                    />
                    <label htmlFor="json" className="flex items-center">
                      <Database className="w-5 h-5 text-blue-600 mr-2" />
                      <div>
                        <div className="font-medium">Complete Backup (JSON)</div>
                        <div className="text-sm text-gray-600">All profile data, jobs, and applications</div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="csv"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'csv')}
                    />
                    <label htmlFor="csv" className="flex items-center">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <div>
                        <div className="font-medium">Applications (CSV)</div>
                        <div className="text-sm text-gray-600">Job applications in spreadsheet format</div>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id="pdf"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={(e) => setExportFormat(e.target.value as 'pdf')}
                    />
                    <label htmlFor="pdf" className="flex items-center">
                      <FileText className="w-5 h-5 text-red-600 mr-2" />
                      <div>
                        <div className="font-medium">Resume (PDF)</div>
                        <div className="text-sm text-gray-600">Current resume in PDF format</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Export Information</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      {exportFormat === 'json' && 'Complete backup includes all your data and can be used to restore your profile on another device.'}
                      {exportFormat === 'csv' && 'CSV export is perfect for analyzing your applications in Excel or Google Sheets.'}
                      {exportFormat === 'pdf' && 'PDF export creates a professional resume using your current profile data.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExport}
                disabled={loading}
                className="btn-primary flex items-center w-full justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Backup File
                    </label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="input-field"
                    />
                    {importFile && (
                      <p className="text-sm text-green-600 mt-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {importFile.name} selected
                      </p>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-900">Import Warning</h4>
                        <p className="text-sm text-yellow-800 mt-1">
                          Importing data will replace all existing data. Make sure to export your current data first if you want to keep it.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleImport}
                    disabled={loading || !importFile}
                    className="btn-primary flex items-center w-full justify-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportImport;
