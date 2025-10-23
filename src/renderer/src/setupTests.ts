import '@testing-library/jest-dom';

// Mock Electron APIs
Object.defineProperty(window, 'electronAPI', {
  value: {
    getPersonalInfo: jest.fn(),
    savePersonalInfo: jest.fn(),
    getAllJobs: jest.fn(),
    saveJob: jest.fn(),
    deleteJob: jest.fn(),
    analyzeJob: jest.fn(),
    calculateMatch: jest.fn(),
    generateTailoredResume: jest.fn(),
    detectJobPage: jest.fn(),
    autoFillForm: jest.fn(),
    getAnalyticsData: jest.fn(),
    exportAllData: jest.fn(),
    importAllData: jest.fn(),
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
