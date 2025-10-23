import { test, expect } from '@playwright/test';

test.describe('Job Application Automation App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  test('should display the main dashboard', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Job Queue')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
  });

  test('should create a new job application', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click Add Job button
    await page.click('text=Add Job');
    
    // Fill in job details
    await page.fill('input[placeholder="Company name"]', 'Test Company');
    await page.fill('input[placeholder="Job title"]', 'Software Engineer');
    await page.fill('input[placeholder="Job URL"]', 'https://example.com/job');
    await page.fill('textarea[placeholder="Job description"]', 'Great opportunity to work on exciting projects');
    
    // Save the job
    await page.click('text=Save Job');
    
    // Verify job was created
    await expect(page.getByText('Test Company')).toBeVisible();
    await expect(page.getByText('Software Engineer')).toBeVisible();
  });

  test('should edit job details', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click edit button on first job
    await page.click('button[title="Edit job"]');
    
    // Update job details
    await page.fill('input[placeholder="Company name"]', 'Updated Company');
    
    // Save changes
    await page.click('text=Save Job');
    
    // Verify job was updated
    await expect(page.getByText('Updated Company')).toBeVisible();
  });

  test('should delete a job', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click delete button on first job
    await page.click('button[title="Delete job"]');
    
    // Confirm deletion
    await page.click('text=Delete');
    
    // Verify job was deleted
    await expect(page.getByText('No jobs found')).toBeVisible();
  });

  test('should navigate to profile and edit personal info', async ({ page }) => {
    // Navigate to Profile
    await page.click('text=Profile');
    
    // Click on Personal Info tab
    await page.click('text=Personal Info');
    
    // Fill in personal information
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.fill('input[name="location"]', 'San Francisco, CA');
    
    // Save personal info
    await page.click('text=Save');
    
    // Verify data was saved
    await expect(page.getByDisplayValue('John Doe')).toBeVisible();
  });

  test('should add work experience', async ({ page }) => {
    // Navigate to Profile
    await page.click('text=Profile');
    
    // Click on Work Experience tab
    await page.click('text=Work Experience');
    
    // Click Add Experience
    await page.click('text=Add Experience');
    
    // Fill in work experience
    await page.fill('input[placeholder="Company name"]', 'Tech Corp');
    await page.fill('input[placeholder="Job title"]', 'Senior Developer');
    await page.fill('input[placeholder="Start date"]', '2020-01-01');
    await page.fill('input[placeholder="End date"]', '2023-12-31');
    await page.fill('textarea[placeholder="Job description"]', 'Led development of key features');
    
    // Save experience
    await page.click('text=Save');
    
    // Verify experience was added
    await expect(page.getByText('Tech Corp')).toBeVisible();
  });

  test('should analyze job requirements', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click on a job to view details
    await page.click('text=View Details');
    
    // Click Analyze Job Requirements
    await page.click('text=Analyze Job Requirements');
    
    // Wait for analysis to complete
    await expect(page.getByText('Analysis Complete')).toBeVisible();
    
    // Verify analysis results are displayed
    await expect(page.getByText('Required Skills')).toBeVisible();
    await expect(page.getByText('Match Score')).toBeVisible();
  });

  test('should generate tailored resume', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click on a job to view details
    await page.click('text=View Details');
    
    // Click Generate Tailored Resume
    await page.click('text=Generate Tailored Resume');
    
    // Wait for generation to complete
    await expect(page.getByText('Resume Generated')).toBeVisible();
    
    // Verify tailored content is displayed
    await expect(page.getByText('Tailored Content')).toBeVisible();
  });

  test('should detect job page and form fields', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click on a job to view details
    await page.click('text=View Details');
    
    // Click Detect Job Page
    await page.click('text=Detect Job Page');
    
    // Wait for detection to complete
    await expect(page.getByText('Detection Complete')).toBeVisible();
    
    // Verify detected fields are displayed
    await expect(page.getByText('Detected Fields')).toBeVisible();
  });

  test('should handle batch processing', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Select multiple jobs
    await page.check('input[type="checkbox"]');
    
    // Click Batch Process
    await page.click('text=Batch Process');
    
    // Configure batch settings
    await page.fill('input[name="max_applications"]', '5');
    await page.check('input[name="auto_submit"]');
    
    // Start batch processing
    await page.click('text=Start Batch');
    
    // Verify batch processing started
    await expect(page.getByText('Batch Processing')).toBeVisible();
  });

  test('should display analytics dashboard', async ({ page }) => {
    // Navigate to Analytics
    await page.click('text=Analytics');
    
    // Verify dashboard components
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Total Applications')).toBeVisible();
    await expect(page.getByText('Response Rate')).toBeVisible();
    
    // Check for charts
    await expect(page.locator('svg')).toBeVisible();
  });

  test('should export data', async ({ page }) => {
    // Navigate to Settings
    await page.click('text=Settings');
    
    // Click Export/Import
    await page.click('text=Export/Import');
    
    // Select export format
    await page.click('input[value="json"]');
    
    // Click Export
    await page.click('text=Export Data');
    
    // Verify export completed
    await expect(page.getByText('Export completed successfully')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    // Check initial state
    await expect(page.locator('html')).not.toHaveClass('dark');
    
    // Toggle dark mode
    await page.keyboard.press('Control+Shift+D');
    
    // Verify dark mode is enabled
    await expect(page.locator('html')).toHaveClass('dark');
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+N for new job
    await page.keyboard.press('Control+n');
    
    // Verify new job form is opened
    await expect(page.getByText('Company *')).toBeVisible();
    
    // Test Ctrl+F for search
    await page.keyboard.press('Control+f');
    
    // Verify search is focused
    await expect(page.locator('input[type="search"]')).toBeFocused();
  });

  test('should show loading states', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click Add Job
    await page.click('text=Add Job');
    
    // Fill form and save
    await page.fill('input[placeholder="Company name"]', 'Test Company');
    await page.fill('input[placeholder="Job title"]', 'Test Position');
    await page.click('text=Save Job');
    
    // Verify loading state
    await expect(page.getByText('Saving...')).toBeVisible();
  });

  test('should show error messages', async ({ page }) => {
    // Navigate to Job Queue
    await page.click('text=Job Queue');
    
    // Click Add Job
    await page.click('text=Add Job');
    
    // Try to save without required fields
    await page.click('text=Save Job');
    
    // Verify error messages
    await expect(page.getByText('Company is required')).toBeVisible();
    await expect(page.getByText('Position is required')).toBeVisible();
  });
});
