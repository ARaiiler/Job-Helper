import { chromium, Browser, Page, ElementHandle } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { AutomationSettings, DetectionResult, FormField, AutomationLog, FieldMapping, FillResult, PersonalInfo, ApplicationSubmission, CaptchaDetection, VisionAnalysis, VisionField } from '../shared/types';

export default class AutomationService {
  private browser: Browser | null = null;
  private settings: AutomationSettings;

  constructor() {
    this.settings = {
      headless: true,
      timeout: 30000,
      screenshotDirectory: path.join(process.cwd(), 'screenshots'),
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: {
        width: 1920,
        height: 1080
      }
    };
  }

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.settings.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Ensure screenshot directory exists
      if (!fs.existsSync(this.settings.screenshotDirectory)) {
        fs.mkdirSync(this.settings.screenshotDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async detectJobPage(jobUrl: string, jobTitle: string): Promise<DetectionResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const result: DetectionResult = {
      success: false,
      applyButtonFound: false,
      formFields: [],
      pageTitle: '',
      pageUrl: '',
      errors: [],
      warnings: []
    };

    let page: Page | null = null;

    try {
      page = await this.browser.newPage({
        userAgent: this.settings.userAgent,
        viewport: this.settings.viewport
      });

      // Set timeout
      page.setDefaultTimeout(this.settings.timeout);

      // Navigate to job page
      await page.goto(jobUrl, { waitUntil: 'networkidle' });
      
      result.pageUrl = page.url();
      result.pageTitle = await page.title();

      // Take initial screenshot
      const screenshotPath = await this.takeScreenshot(page, 'initial_page');
      result.screenshotPath = screenshotPath;

      // Detect Apply button
      const applyButton = await this.detectApplyButton(page);
      if (applyButton) {
        result.applyButtonFound = true;
        result.applyButtonSelector = applyButton.selector;
        
        // Click apply button to navigate to application form
        try {
          await page.click(applyButton.selector);
          await page.waitForLoadState('networkidle');
          
          // Take screenshot after clicking apply
          await this.takeScreenshot(page, 'after_apply_click');
          
          // Detect form fields on the application page
          result.formFields = await this.detectFormFields(page);
          
        } catch (error) {
          result.warnings.push(`Failed to click apply button: ${error}`);
        }
      } else {
        result.warnings.push('No apply button found');
      }

      result.success = true;

    } catch (error) {
      result.errors.push(`Detection failed: ${error}`);
      console.error('Job page detection failed:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }

    return result;
  }

  private async detectApplyButton(page: Page): Promise<{ selector: string; text: string } | null> {
    const applySelectors = [
      'button[data-testid*="apply"]',
      'button[class*="apply"]',
      'a[href*="apply"]',
      'button:has-text("Apply")',
      'a:has-text("Apply")',
      'button:has-text("Apply Now")',
      'a:has-text("Apply Now")',
      'button:has-text("Apply for this job")',
      'a:has-text("Apply for this job")',
      '[data-testid="apply-button"]',
      '.apply-button',
      '#apply-button',
      'button[aria-label*="apply" i]',
      'a[aria-label*="apply" i]'
    ];

    for (const selector of applySelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          const isVisible = await element.isVisible();
          if (isVisible && text) {
            return { selector, text: text.trim() };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return null;
  }

  private async detectFormFields(page: Page): Promise<FormField[]> {
    const fields: FormField[] = [];

    // Common form field selectors
    const fieldSelectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[type="password"]',
      'textarea',
      'select',
      'input[type="file"]',
      'input[type="checkbox"]',
      'input[type="radio"]'
    ];

    for (const selector of fieldSelectors) {
      try {
        const elements = await page.$$(selector);
        
        for (const element of elements) {
          const field = await this.analyzeFormField(element);
          if (field) {
            fields.push(field);
          }
        }
      } catch (error) {
        console.error(`Error detecting fields with selector ${selector}:`, error);
      }
    }

    return fields;
  }

  private async analyzeFormField(element: ElementHandle): Promise<FormField | null> {
    try {
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      const type = await element.getAttribute('type') || 'text';
      const name = await element.getAttribute('name') || '';
      const id = await element.getAttribute('id') || '';
      const placeholder = await element.getAttribute('placeholder') || '';
      const required = await element.evaluate(el => el.hasAttribute('required'));
      
      // Get label text
      let label = '';
      if (id) {
        const labelElement = await element.evaluateHandle((el: any) => 
          (globalThis as any).document.querySelector(`label[for="${el.id}"]`)
        );
        if (labelElement) {
          label = await labelElement.textContent() || '';
        }
      }

      // Determine field type
      let fieldType: FormField['type'] = 'text';
      if (type === 'email') fieldType = 'email';
      else if (type === 'tel') fieldType = 'phone';
      else if (type === 'file') fieldType = 'file';
      else if (type === 'checkbox') fieldType = 'checkbox';
      else if (type === 'radio') fieldType = 'radio';
      else if (tagName === 'textarea') fieldType = 'textarea';
      else if (tagName === 'select') fieldType = 'select';

      // Generate selector
      let selector = '';
      if (id) selector = `#${id}`;
      else if (name) selector = `[name="${name}"]`;
      else selector = await element.evaluate(el => {
        const attrs = [];
        if (el.id) attrs.push(`#${el.id}`);
        if (el.className) attrs.push(`.${el.className.split(' ').join('.')}`);
        return attrs.join('') || el.tagName.toLowerCase();
      });

      return {
        type: fieldType,
        name: name || id || 'unnamed',
        id: id || undefined,
        placeholder: placeholder || undefined,
        label: label || undefined,
        required,
        selector
      };

    } catch (error) {
      console.error('Error analyzing form field:', error);
      return null;
    }
  }

  private async takeScreenshot(page: Page, name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}_${timestamp}.png`;
    const filepath = path.join(this.settings.screenshotDirectory, filename);
    
    await page.screenshot({ path: filepath, fullPage: true });
    return filepath;
  }

  async updateSettings(settings: AutomationSettings): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    
    // Restart browser if headless mode changed
    if (this.browser) {
      await this.browser.close();
      await this.initialize();
    }
  }

  getSettings(): AutomationSettings {
    return this.settings;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Auto-Fill Methods
  async autoFillForm(jobUrl: string, personalInfo: PersonalInfo, tailoredResumePath?: string): Promise<FillResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const result: FillResult = {
      success: false,
      filledFields: [],
      unfilledFields: [],
      errors: [],
      warnings: [],
      screenshots: []
    };

    let page: Page | null = null;

    try {
      page = await this.browser.newPage({
        userAgent: this.settings.userAgent,
        viewport: this.settings.viewport
      });

      page.setDefaultTimeout(this.settings.timeout);

      // Navigate to job page
      await page.goto(jobUrl, { waitUntil: 'networkidle' });
      
      // Take initial screenshot
      const initialScreenshot = await this.takeScreenshot(page, 'initial_page');
      result.screenshots.push(initialScreenshot);

      // Detect and click apply button
      const applyButton = await this.detectApplyButton(page);
      if (!applyButton) {
        result.errors.push('No apply button found');
        return result;
      }

      await page.click(applyButton.selector);
      await page.waitForLoadState('networkidle');

      // Take screenshot after clicking apply
      const afterApplyScreenshot = await this.takeScreenshot(page, 'after_apply_click');
      result.screenshots.push(afterApplyScreenshot);

      // Handle multi-page applications
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        // Detect form fields on current page
        const formFields = await this.detectFormFields(page);
        
        // Map fields to profile data
        const fieldMappings = await this.mapFieldsToProfile(formFields, personalInfo, tailoredResumePath);
        
        // Fill form fields
        const fillResult = await this.fillFormFields(page, fieldMappings);
        result.filledFields.push(...fillResult.filledFields);
        result.unfilledFields.push(...fillResult.unfilledFields);
        result.errors.push(...fillResult.errors);
        result.warnings.push(...fillResult.warnings);

        // Take screenshot after filling
        const filledScreenshot = await this.takeScreenshot(page, `filled_page_${currentPage}`);
        result.screenshots.push(filledScreenshot);

        // Check for next page or submit button
        const nextButton = await this.detectNextButton(page);
        const submitButton = await this.detectSubmitButton(page);

        if (submitButton) {
          // Found submit button, stop here
          hasNextPage = false;
          result.finalPageUrl = page.url();
        } else if (nextButton) {
          // Click next button and continue
          await page.click(nextButton.selector);
          await page.waitForLoadState('networkidle');
          currentPage++;
        } else {
          // No next or submit button found
          hasNextPage = false;
          result.warnings.push('No submit button found, may need manual submission');
        }
      }

      result.success = true;

    } catch (error) {
      result.errors.push(`Auto-fill failed: ${error}`);
      console.error('Auto-fill failed:', error);
    } finally {
      if (page) {
        await page.close();
      }
    }

    return result;
  }

  private async mapFieldsToProfile(formFields: FormField[], personalInfo: PersonalInfo, tailoredResumePath?: string): Promise<FieldMapping[]> {
    const mappings: FieldMapping[] = [];
    
    // Field mapping patterns
    const fieldPatterns = {
      firstName: ['firstName', 'first_name', 'fname', 'givenName', 'firstname'],
      lastName: ['lastName', 'last_name', 'lname', 'surname', 'familyName', 'lastname'],
      email: ['email', 'emailAddress', 'email_address', 'e-mail', 'mail'],
      phone: ['phone', 'phoneNumber', 'phone_number', 'mobile', 'telephone', 'tel'],
      address: ['address', 'street', 'streetAddress', 'street_address'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      zipCode: ['zipCode', 'zip_code', 'postalCode', 'postal_code', 'zip'],
      location: ['location', 'address', 'city'],
      linkedin: ['linkedin', 'linkedinUrl', 'linkedin_url', 'linkedIn', 'linkedinProfile'],
      portfolio: ['portfolio', 'website', 'personalWebsite', 'personal_website'],
      resume: ['resume', 'cv', 'curriculumVitae', 'curriculum_vitae', 'file', 'upload']
    };

    for (const field of formFields) {
      const fieldName = field.name.toLowerCase();
      const fieldId = field.id?.toLowerCase() || '';
      const fieldPlaceholder = field.placeholder?.toLowerCase() || '';
      
      let mappedValue = '';
      let confidence = 0;
      let profileField = '';

      // Check for first name
      if (fieldPatterns.firstName.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        const nameParts = personalInfo.name.split(' ');
        mappedValue = nameParts[0] || '';
        confidence = 0.9;
        profileField = 'firstName';
      }
      // Check for last name
      else if (fieldPatterns.lastName.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        const nameParts = personalInfo.name.split(' ');
        mappedValue = nameParts.slice(1).join(' ') || '';
        confidence = 0.9;
        profileField = 'lastName';
      }
      // Check for email
      else if (fieldPatterns.email.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        mappedValue = personalInfo.email || '';
        confidence = 0.95;
        profileField = 'email';
      }
      // Check for phone
      else if (fieldPatterns.phone.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        mappedValue = personalInfo.phone || '';
        confidence = 0.9;
        profileField = 'phone';
      }
      // Check for location/city
      else if (fieldPatterns.location.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        mappedValue = personalInfo.location || '';
        confidence = 0.8;
        profileField = 'location';
      }
      // Check for LinkedIn
      else if (fieldPatterns.linkedin.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        mappedValue = personalInfo.linkedin || '';
        confidence = 0.9;
        profileField = 'linkedin';
      }
      // Check for portfolio
      else if (fieldPatterns.portfolio.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        mappedValue = personalInfo.portfolio || '';
        confidence = 0.9;
        profileField = 'portfolio';
      }
      // Check for resume upload
      else if (field.type === 'file' && fieldPatterns.resume.some(pattern => 
        fieldName.includes(pattern) || fieldId.includes(pattern) || fieldPlaceholder.includes(pattern)
      )) {
        mappedValue = tailoredResumePath || '';
        confidence = 0.95;
        profileField = 'resume';
      }

      if (mappedValue && confidence > 0) {
        mappings.push({
          detectedField: field,
          profileField,
          value: mappedValue,
          confidence
        });
      }
    }

    return mappings;
  }

  private async fillFormFields(page: Page, fieldMappings: FieldMapping[]): Promise<{ filledFields: FieldMapping[], unfilledFields: FormField[], errors: string[], warnings: string[] }> {
    const filledFields: FieldMapping[] = [];
    const unfilledFields: FormField[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const mapping of fieldMappings) {
      try {
        const { detectedField, value } = mapping;
        
        if (detectedField.type === 'file' && mapping.profileField === 'resume') {
          // Handle file upload
          if (value && fs.existsSync(value)) {
            await page.setInputFiles(detectedField.selector, value);
            filledFields.push(mapping);
          } else {
            warnings.push(`Resume file not found: ${value}`);
          }
        } else if (detectedField.type === 'checkbox') {
          // Handle checkboxes (usually for terms acceptance)
          const isChecked = await page.isChecked(detectedField.selector);
          if (!isChecked) {
            await page.check(detectedField.selector);
            filledFields.push(mapping);
          }
        } else if (detectedField.type === 'select') {
          // Handle dropdowns
          try {
            await page.selectOption(detectedField.selector, { label: value });
            filledFields.push(mapping);
          } catch (error) {
            // Try selecting by value if label fails
            try {
              await page.selectOption(detectedField.selector, value);
              filledFields.push(mapping);
            } catch (error2) {
              warnings.push(`Could not select option "${value}" for field ${detectedField.name}`);
            }
          }
        } else {
          // Handle text inputs and textareas
          await page.fill(detectedField.selector, value);
          
          // Add realistic typing delay for text inputs
          if (detectedField.type === 'text' || detectedField.type === 'email' || detectedField.type === 'phone') {
            await page.type(detectedField.selector, '', { delay: 100 });
          }
          
          filledFields.push(mapping);
        }
      } catch (error) {
        errors.push(`Failed to fill field ${mapping.detectedField.name}: ${error}`);
        unfilledFields.push(mapping.detectedField);
      }
    }

    return { filledFields, unfilledFields, errors, warnings };
  }

  private async detectNextButton(page: Page): Promise<{ selector: string; text: string } | null> {
    const nextSelectors = [
      'button:has-text("Next")',
      'button:has-text("Continue")',
      'button:has-text("Proceed")',
      'button:has-text("Next Step")',
      'a:has-text("Next")',
      'a:has-text("Continue")',
      '[data-testid*="next"]',
      '[class*="next"]',
      'button[aria-label*="next" i]',
      'a[aria-label*="next" i]'
    ];

    for (const selector of nextSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          const isVisible = await element.isVisible();
          if (isVisible && text) {
            return { selector, text: text.trim() };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return null;
  }

  private async detectSubmitButton(page: Page): Promise<{ selector: string; text: string } | null> {
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Apply")',
      'button:has-text("Send Application")',
      'button:has-text("Submit Application")',
      'input[type="submit"]',
      '[data-testid*="submit"]',
      '[class*="submit"]',
      'button[aria-label*="submit" i]',
      'button[aria-label*="apply" i]'
    ];

    for (const selector of submitSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          const isVisible = await element.isVisible();
          if (isVisible && text) {
            return { selector, text: text.trim() };
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return null;
  }

  async submitApplication(jobUrl: string, submitButtonSelector: string): Promise<ApplicationSubmission> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    let page: Page | null = null;

    try {
      page = await this.browser.newPage({
        userAgent: this.settings.userAgent,
        viewport: this.settings.viewport
      });

      page.setDefaultTimeout(this.settings.timeout);

      // Navigate to the application page
      await page.goto(jobUrl, { waitUntil: 'networkidle' });

      // Click submit button
      await page.click(submitButtonSelector);
      
      // Wait for submission to complete
      await page.waitForLoadState('networkidle');

      // Take final screenshot
      const finalScreenshot = await this.takeScreenshot(page, 'submission_complete');

      return {
        job_id: 0, // Will be set by caller
        filledData: [], // Will be set by caller
        screenshots: [finalScreenshot],
        submittedAt: new Date().toISOString(),
        finalUrl: page.url(),
        success: true
      };

    } catch (error) {
      console.error('Application submission failed:', error);
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  // CAPTCHA Detection Methods
  async detectCaptcha(jobUrl: string): Promise<CaptchaDetection> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const detection: CaptchaDetection = {
      detected: false,
      type: 'unknown',
      confidence: 0,
      indicators: [],
      pageUrl: jobUrl,
      detectedAt: new Date().toISOString()
    };

    let page: Page | null = null;

    try {
      page = await this.browser.newPage({
        userAgent: this.settings.userAgent,
        viewport: this.settings.viewport
      });

      page.setDefaultTimeout(this.settings.timeout);

      // Navigate to job page
      await page.goto(jobUrl, { waitUntil: 'networkidle' });

      // Check for reCAPTCHA
      const recaptchaIndicators = await this.checkRecaptcha(page);
      if (recaptchaIndicators.length > 0) {
        detection.detected = true;
        detection.type = 'recaptcha';
        detection.confidence = 0.95;
        detection.indicators = recaptchaIndicators;
      }

      // Check for hCaptcha
      const hcaptchaIndicators = await this.checkHcaptcha(page);
      if (hcaptchaIndicators.length > 0) {
        detection.detected = true;
        detection.type = 'hcaptcha';
        detection.confidence = 0.95;
        detection.indicators = hcaptchaIndicators;
      }

      // Check for Cloudflare
      const cloudflareIndicators = await this.checkCloudflare(page);
      if (cloudflareIndicators.length > 0) {
        detection.detected = true;
        detection.type = 'cloudflare';
        detection.confidence = 0.9;
        detection.indicators = cloudflareIndicators;
      }

      // Check for Turnstile
      const turnstileIndicators = await this.checkTurnstile(page);
      if (turnstileIndicators.length > 0) {
        detection.detected = true;
        detection.type = 'turnstile';
        detection.confidence = 0.95;
        detection.indicators = turnstileIndicators;
      }

      // Check for generic CAPTCHA text
      const genericIndicators = await this.checkGenericCaptcha(page);
      if (genericIndicators.length > 0 && !detection.detected) {
        detection.detected = true;
        detection.type = 'unknown';
        detection.confidence = 0.7;
        detection.indicators = genericIndicators;
      }

      // Take screenshot if CAPTCHA detected
      if (detection.detected) {
        detection.screenshotPath = await this.takeScreenshot(page, 'captcha_detected');
      }

    } catch (error) {
      console.error('CAPTCHA detection failed:', error);
      detection.indicators.push(`Detection error: ${error}`);
    } finally {
      if (page) {
        await page.close();
      }
    }

    return detection;
  }

  private async checkRecaptcha(page: Page): Promise<string[]> {
    const indicators: string[] = [];
    
    const recaptchaSelectors = [
      'iframe[src*="recaptcha"]',
      'div[class*="recaptcha"]',
      'div[id*="recaptcha"]',
      '.g-recaptcha',
      '[data-sitekey]',
      'iframe[title*="reCAPTCHA"]'
    ];

    for (const selector of recaptchaSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          indicators.push(`reCAPTCHA element found: ${selector}`);
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Check for reCAPTCHA text
    const recaptchaTexts = [
      'verify you are human',
      'complete the reCAPTCHA',
      'i\'m not a robot',
      'click to verify'
    ];

    for (const text of recaptchaTexts) {
      try {
        const element = await page.$(`text=${text}`);
        if (element) {
          indicators.push(`reCAPTCHA text found: "${text}"`);
        }
      } catch (error) {
        // Continue to next text
      }
    }

    return indicators;
  }

  private async checkHcaptcha(page: Page): Promise<string[]> {
    const indicators: string[] = [];
    
    const hcaptchaSelectors = [
      'iframe[src*="hcaptcha"]',
      'div[class*="hcaptcha"]',
      'div[id*="hcaptcha"]',
      '.h-captcha',
      '[data-sitekey*="hcaptcha"]'
    ];

    for (const selector of hcaptchaSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          indicators.push(`hCaptcha element found: ${selector}`);
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return indicators;
  }

  private async checkCloudflare(page: Page): Promise<string[]> {
    const indicators: string[] = [];
    
    // Check for Cloudflare challenge page
    const cloudflareSelectors = [
      'div[class*="cf-challenge"]',
      'div[id*="cf-challenge"]',
      '.cf-challenge-running',
      '.cf-challenge-success',
      'iframe[src*="cloudflare"]'
    ];

    for (const selector of cloudflareSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          indicators.push(`Cloudflare element found: ${selector}`);
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Check for Cloudflare text
    const cloudflareTexts = [
      'checking your browser',
      'cloudflare',
      'ddos protection',
      'please wait'
    ];

    for (const text of cloudflareTexts) {
      try {
        const element = await page.$(`text=${text}`);
        if (element) {
          indicators.push(`Cloudflare text found: "${text}"`);
        }
      } catch (error) {
        // Continue to next text
      }
    }

    return indicators;
  }

  private async checkTurnstile(page: Page): Promise<string[]> {
    const indicators: string[] = [];
    
    const turnstileSelectors = [
      'iframe[src*="turnstile"]',
      'div[class*="turnstile"]',
      'div[id*="turnstile"]',
      '.cf-turnstile',
      '[data-sitekey*="turnstile"]'
    ];

    for (const selector of turnstileSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          indicators.push(`Turnstile element found: ${selector}`);
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    return indicators;
  }

  private async checkGenericCaptcha(page: Page): Promise<string[]> {
    const indicators: string[] = [];
    
    const genericTexts = [
      'verify you\'re human',
      'complete the captcha',
      'prove you are human',
      'security check',
      'human verification',
      'captcha',
      'verification required'
    ];

    for (const text of genericTexts) {
      try {
        const element = await page.$(`text=${text}`);
        if (element) {
          indicators.push(`Generic CAPTCHA text found: "${text}"`);
        }
      } catch (error) {
        // Continue to next text
      }
    }

    return indicators;
  }

  async openExternalBrowser(url: string): Promise<void> {
    const { spawn } = require('child_process');
    
    // Open URL in default browser
    const command = process.platform === 'win32' ? 'start' : 
                   process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    spawn(command, [url], { detached: true, stdio: 'ignore' });
  }
}
