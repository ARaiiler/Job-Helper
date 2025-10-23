import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import JobQueue from '../components/JobQueue';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { DarkModeProvider } from '../contexts/DarkModeContext';

// Mock the electron API
const mockElectronAPI = {
  getAllJobs: jest.fn(),
  saveJob: jest.fn(),
  deleteJob: jest.fn(),
  getAnalyticsData: jest.fn(),
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <DarkModeProvider>
        {component}
      </DarkModeProvider>
    </BrowserRouter>
  );
};

describe('JobQueue Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockElectronAPI.getAllJobs.mockResolvedValue([]);
  });

  it('renders job queue with empty state', async () => {
    renderWithRouter(<JobQueue />);
    
    expect(screen.getByText('Job Queue')).toBeInTheDocument();
    expect(screen.getByText('Add Job')).toBeInTheDocument();
  });

  it('opens add job form when clicking Add Job button', async () => {
    renderWithRouter(<JobQueue />);
    
    const addButton = screen.getByText('Add Job');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Company *')).toBeInTheDocument();
    expect(screen.getByText('Position *')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithRouter(<JobQueue />);
    
    const addButton = screen.getByText('Add Job');
    fireEvent.click(addButton);
    
    const saveButton = screen.getByText('Save Job');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Company is required')).toBeInTheDocument();
    expect(screen.getByText('Position is required')).toBeInTheDocument();
  });

  it('saves job with valid data', async () => {
    const mockJob = {
      company: 'Test Company',
      position: 'Test Position',
      job_url: 'https://example.com',
      description: 'Test description',
      status: 'queued',
      notes: ''
    };

    mockElectronAPI.saveJob.mockResolvedValue({ id: 1, ...mockJob });
    mockElectronAPI.getAllJobs.mockResolvedValue([{ id: 1, ...mockJob }]);

    renderWithRouter(<JobQueue />);
    
    const addButton = screen.getByText('Add Job');
    fireEvent.click(addButton);
    
    fireEvent.change(screen.getByPlaceholderText('Company name'), {
      target: { value: 'Test Company' }
    });
    fireEvent.change(screen.getByPlaceholderText('Job title'), {
      target: { value: 'Test Position' }
    });
    
    const saveButton = screen.getByText('Save Job');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockElectronAPI.saveJob).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Test Company',
          position: 'Test Position'
        })
      );
    });
  });
});

describe('AnalyticsDashboard Component', () => {
  const mockAnalyticsData = {
    applicationsOverTime: [
      { date: '2024-01-01', applications: 5, responses: 2 },
      { date: '2024-01-02', applications: 3, responses: 1 }
    ],
    statusBreakdown: [
      { status: 'Applied', count: 10, percentage: 50 },
      { status: 'Interviewing', count: 3, percentage: 15 },
      { status: 'Rejected', count: 5, percentage: 25 },
      { status: 'Offer', count: 2, percentage: 10 }
    ],
    jobBoardPerformance: [
      { board: 'LinkedIn', total: 5, successful: 3, successRate: 60, averageTime: 2 },
      { board: 'Indeed', total: 3, successful: 1, successRate: 33, averageTime: 3 }
    ],
    responseRate: {
      totalApplications: 20,
      totalResponses: 8,
      responseRate: 40,
      averageResponseTime: 5
    },
    topCompanies: [
      { company: 'Google', applications: 3, successRate: 67 },
      { company: 'Microsoft', applications: 2, successRate: 50 }
    ],
    insights: {
      bestPerformingBoards: ['LinkedIn', 'Indeed'],
      mostRequestedSkills: ['JavaScript', 'React', 'Node.js'],
      optimalApplicationTimes: ['Tuesday 10 AM', 'Wednesday 2 PM'],
      successPatterns: ['Tailored resumes work better']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockElectronAPI.getAnalyticsData.mockResolvedValue(mockAnalyticsData);
  });

  it('renders analytics dashboard with data', async () => {
    renderWithRouter(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    mockElectronAPI.getAnalyticsData.mockImplementation(() => new Promise(() => {}));
    
    renderWithRouter(<AnalyticsDashboard />);
    
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('shows empty state when no data', async () => {
    mockElectronAPI.getAnalyticsData.mockResolvedValue(null);
    
    renderWithRouter(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No Data Available')).toBeInTheDocument();
    });
  });

  it('changes time range when selecting different option', async () => {
    renderWithRouter(<AnalyticsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Last 30 days')).toBeInTheDocument();
    });
    
    const select = screen.getByDisplayValue('Last 30 days');
    fireEvent.change(select, { target: { value: '7' } });
    
    await waitFor(() => {
      expect(mockElectronAPI.getAnalyticsData).toHaveBeenCalledWith(7);
    });
  });
});

describe('Dark Mode Context', () => {
  it('toggles dark mode', () => {
    const TestComponent = () => {
      const { isDark, toggleDarkMode } = useDarkMode();
      return (
        <div>
          <span data-testid="dark-mode">{isDark.toString()}</span>
          <button onClick={toggleDarkMode}>Toggle</button>
        </div>
      );
    };

    renderWithRouter(<TestComponent />);
    
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('false');
    
    const toggleButton = screen.getByText('Toggle');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('dark-mode')).toHaveTextContent('true');
  });
});
