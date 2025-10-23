import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import PersonalInfo from './components/PersonalInfo';
import WorkExperience from './components/WorkExperience';
import Education from './components/Education';
import Skills from './components/Skills';
import Certifications from './components/Certifications';
import Dashboard from './components/Dashboard';
import JobQueue from './components/JobQueue';
import JobDetail from './components/JobDetail';
import Settings from './components/Settings';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { PersonalInfo as PersonalInfoType } from '@shared/types';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { useAppShortcuts } from './hooks/useKeyboardShortcuts';
import Loading from './components/Loading';

function App() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPersonalInfo();
  }, []);

  const loadPersonalInfo = async () => {
    try {
      const data = await window.electronAPI.getPersonalInfo();
      setPersonalInfo(data);
    } catch (error) {
      console.error('Failed to load personal info:', error);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useAppShortcuts({
    newJob: () => {
      // Navigate to jobs and trigger new job
      window.location.href = '/jobs';
    },
    save: () => {
      // Trigger save on current form
      const saveButton = document.querySelector('button[type="submit"]');
      if (saveButton) {
        (saveButton as HTMLButtonElement).click();
      }
    },
    delete: () => {
      // Trigger delete on selected item
      const deleteButton = document.querySelector('button[title*="Delete"]');
      if (deleteButton) {
        (deleteButton as HTMLButtonElement).click();
      }
    },
    search: () => {
      // Focus search input
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) {
        (searchInput as HTMLInputElement).focus();
      }
    },
    settings: () => {
      window.location.href = '/settings';
    },
    darkMode: () => {
      // Toggle dark mode
      document.documentElement.classList.toggle('dark');
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" text="Loading Job Tracker Pro..." />
      </div>
    );
  }

  return (
    <DarkModeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Dashboard personalInfo={personalInfo} />} />
              <Route path="/profile" element={
                <div className="space-y-6">
                  <PersonalInfo personalInfo={personalInfo} onUpdate={setPersonalInfo} />
                  <WorkExperience />
                  <Education />
                  <Skills />
                  <Certifications />
                </div>
              } />
              <Route path="/jobs" element={<JobQueue />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
            },
          }}
        />
      </Router>
    </DarkModeProvider>
  );
}

export default App;
