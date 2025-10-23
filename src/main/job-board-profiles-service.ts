import { JobBoardProfile, JobBoardSelectors } from '../shared/types';

export default class JobBoardProfilesService {
  private profiles: Map<string, JobBoardProfile> = new Map();

  constructor() {
    this.initializeDefaultProfiles();
  }

  private initializeDefaultProfiles(): void {
    // LinkedIn Easy Apply
    const linkedinProfile: JobBoardProfile = {
      id: 'linkedin',
      name: 'LinkedIn Easy Apply',
      domain: 'linkedin\\.com',
      enabled: true,
      captcha_likelihood: 'medium',
      navigation_flow: 'modal',
      custom_selectors: {
        apply_button: [
          'button[data-control-name="jobdetails_topcard_inapply"]',
          'button:has-text("Easy Apply")',
          '.jobs-apply-button',
          '[data-testid="apply-button"]'
        ],
        form_container: [
          '.jobs-easy-apply-modal',
          '.jobs-apply-modal',
          '[data-testid="apply-modal"]'
        ],
        fields: {
          first_name: [
            'input[name="firstName"]',
            'input[id="firstName"]',
            'input[data-testid="firstName"]'
          ],
          last_name: [
            'input[name="lastName"]',
            'input[id="lastName"]',
            'input[data-testid="lastName"]'
          ],
          email: [
            'input[name="email"]',
            'input[type="email"]',
            'input[data-testid="email"]'
          ],
          phone: [
            'input[name="phoneNumber"]',
            'input[type="tel"]',
            'input[data-testid="phoneNumber"]'
          ],
          location: [
            'input[name="location"]',
            'input[data-testid="location"]'
          ],
          linkedin: [
            'input[name="linkedinUrl"]',
            'input[data-testid="linkedinUrl"]'
          ],
          portfolio: [
            'input[name="website"]',
            'input[data-testid="website"]'
          ],
          resume_upload: [
            'input[type="file"][accept*="pdf"]',
            'input[data-testid="resume-upload"]'
          ],
          cover_letter: [
            'textarea[name="coverLetter"]',
            'textarea[data-testid="coverLetter"]'
          ]
        },
        navigation: {
          next_button: [
            'button:has-text("Next")',
            'button[data-testid="next-button"]',
            '.jobs-easy-apply-footer button:last-child'
          ],
          submit_button: [
            'button:has-text("Submit")',
            'button[data-testid="submit-button"]',
            '.jobs-easy-apply-footer button:last-child'
          ],
          back_button: [
            'button:has-text("Back")',
            'button[data-testid="back-button"]'
          ]
        },
        captcha: {
          indicators: [
            'text=verify you\'re human',
            'text=complete the security check'
          ],
          iframe_selectors: [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]'
          ]
        }
      },
      quirks: [
        'Modal-based application flow',
        'May require LinkedIn profile completion',
        'Sometimes shows "Easy Apply" vs regular apply button',
        'Resume upload may be pre-populated from LinkedIn profile'
      ],
      rate_limit: {
        max_per_hour: 5,
        max_per_day: 20,
        min_delay: 30,
        max_delay: 120
      }
    };

    // Indeed Quick Apply
    const indeedProfile: JobBoardProfile = {
      id: 'indeed',
      name: 'Indeed Quick Apply',
      domain: 'indeed\\.com',
      enabled: true,
      captcha_likelihood: 'low',
      navigation_flow: 'single_page',
      custom_selectors: {
        apply_button: [
          'button:has-text("Quick Apply")',
          'button:has-text("Apply Now")',
          '[data-testid="apply-button"]',
          '.jobsearch-ApplyButton'
        ],
        form_container: [
          '.jobsearch-ApplyModal',
          '.indeed-apply-modal',
          '[data-testid="apply-modal"]'
        ],
        fields: {
          first_name: [
            'input[name="firstName"]',
            'input[id="firstName"]',
            'input[data-testid="firstName"]'
          ],
          last_name: [
            'input[name="lastName"]',
            'input[id="lastName"]',
            'input[data-testid="lastName"]'
          ],
          email: [
            'input[name="email"]',
            'input[type="email"]',
            'input[data-testid="email"]'
          ],
          phone: [
            'input[name="phoneNumber"]',
            'input[type="tel"]',
            'input[data-testid="phoneNumber"]'
          ],
          location: [
            'input[name="location"]',
            'input[data-testid="location"]'
          ],
          linkedin: [
            'input[name="linkedinUrl"]',
            'input[data-testid="linkedinUrl"]'
          ],
          portfolio: [
            'input[name="website"]',
            'input[data-testid="website"]'
          ],
          resume_upload: [
            'input[type="file"][accept*="pdf"]',
            'input[data-testid="resume-upload"]'
          ],
          cover_letter: [
            'textarea[name="coverLetter"]',
            'textarea[data-testid="coverLetter"]'
          ]
        },
        navigation: {
          next_button: [
            'button:has-text("Next")',
            'button[data-testid="next-button"]'
          ],
          submit_button: [
            'button:has-text("Submit Application")',
            'button[data-testid="submit-button"]'
          ],
          back_button: [
            'button:has-text("Back")',
            'button[data-testid="back-button"]'
          ]
        },
        captcha: {
          indicators: [
            'text=verify you\'re human',
            'text=security check'
          ],
          iframe_selectors: [
            'iframe[src*="recaptcha"]'
          ]
        }
      },
      quirks: [
        'Single-page application form',
        'May redirect to external company site',
        'Resume upload often required',
        'Location field may be auto-filled from profile'
      ],
      rate_limit: {
        max_per_hour: 10,
        max_per_day: 50,
        min_delay: 20,
        max_delay: 90
      }
    };

    // Greenhouse
    const greenhouseProfile: JobBoardProfile = {
      id: 'greenhouse',
      name: 'Greenhouse',
      domain: 'boards\\.greenhouse\\.io|greenhouse\\.io',
      enabled: true,
      captcha_likelihood: 'high',
      navigation_flow: 'multi_step',
      custom_selectors: {
        apply_button: [
          'button:has-text("Apply for this job")',
          'a:has-text("Apply")',
          '.apply-button'
        ],
        form_container: [
          '.application-form',
          '.greenhouse-application',
          'form[action*="greenhouse"]'
        ],
        fields: {
          first_name: [
            'input[name="first_name"]',
            'input[id="first_name"]',
            'input[name="firstname"]'
          ],
          last_name: [
            'input[name="last_name"]',
            'input[id="last_name"]',
            'input[name="lastname"]'
          ],
          email: [
            'input[name="email"]',
            'input[type="email"]',
            'input[name="email_address"]'
          ],
          phone: [
            'input[name="phone"]',
            'input[type="tel"]',
            'input[name="phone_number"]'
          ],
          location: [
            'input[name="location"]',
            'input[name="city"]'
          ],
          linkedin: [
            'input[name="linkedin_url"]',
            'input[name="linkedin"]'
          ],
          portfolio: [
            'input[name="website"]',
            'input[name="portfolio_url"]'
          ],
          resume_upload: [
            'input[type="file"][accept*="pdf"]',
            'input[name="resume"]'
          ],
          cover_letter: [
            'textarea[name="cover_letter"]',
            'textarea[name="coverletter"]'
          ]
        },
        navigation: {
          next_button: [
            'button:has-text("Next")',
            'button:has-text("Continue")',
            'input[type="submit"][value="Next"]'
          ],
          submit_button: [
            'button:has-text("Submit Application")',
            'input[type="submit"][value="Submit"]'
          ],
          back_button: [
            'button:has-text("Back")',
            'a:has-text("Back")'
          ]
        },
        captcha: {
          indicators: [
            'text=verify you\'re human',
            'text=security check',
            '.g-recaptcha'
          ],
          iframe_selectors: [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]'
          ]
        }
      },
      quirks: [
        'Multi-step application process',
        'High CAPTCHA likelihood',
        'May require company-specific questions',
        'Often has custom application fields'
      ],
      rate_limit: {
        max_per_hour: 3,
        max_per_day: 10,
        min_delay: 60,
        max_delay: 180
      }
    };

    // Lever
    const leverProfile: JobBoardProfile = {
      id: 'lever',
      name: 'Lever',
      domain: 'jobs\\.lever\\.co|lever\\.co',
      enabled: true,
      captcha_likelihood: 'medium',
      navigation_flow: 'single_page',
      custom_selectors: {
        apply_button: [
          'button:has-text("Apply for this job")',
          'a:has-text("Apply")',
          '.lever-apply-button'
        ],
        form_container: [
          '.application-form',
          '.lever-application',
          'form[action*="lever"]'
        ],
        fields: {
          first_name: [
            'input[name="firstName"]',
            'input[id="firstName"]'
          ],
          last_name: [
            'input[name="lastName"]',
            'input[id="lastName"]'
          ],
          email: [
            'input[name="email"]',
            'input[type="email"]'
          ],
          phone: [
            'input[name="phone"]',
            'input[type="tel"]'
          ],
          location: [
            'input[name="location"]'
          ],
          linkedin: [
            'input[name="linkedinUrl"]'
          ],
          portfolio: [
            'input[name="website"]'
          ],
          resume_upload: [
            'input[type="file"][accept*="pdf"]'
          ],
          cover_letter: [
            'textarea[name="coverLetter"]'
          ]
        },
        navigation: {
          next_button: [
            'button:has-text("Next")',
            'button:has-text("Continue")'
          ],
          submit_button: [
            'button:has-text("Submit Application")',
            'input[type="submit"]'
          ],
          back_button: [
            'button:has-text("Back")'
          ]
        },
        captcha: {
          indicators: [
            'text=verify you\'re human'
          ],
          iframe_selectors: [
            'iframe[src*="recaptcha"]'
          ]
        }
      },
      quirks: [
        'Single-page application',
        'May have company-specific questions',
        'Resume upload required'
      ],
      rate_limit: {
        max_per_hour: 5,
        max_per_day: 20,
        min_delay: 30,
        max_delay: 120
      }
    };

    // Workday
    const workdayProfile: JobBoardProfile = {
      id: 'workday',
      name: 'Workday',
      domain: 'workday\\.com|myworkdayjobs\\.com',
      enabled: true,
      captcha_likelihood: 'high',
      navigation_flow: 'multi_step',
      custom_selectors: {
        apply_button: [
          'button:has-text("Apply")',
          'a:has-text("Apply")',
          '[data-automation-id="apply-button"]'
        ],
        form_container: [
          '.WDApplicationForm',
          '.workday-application',
          'form[data-automation-id="application-form"]'
        ],
        fields: {
          first_name: [
            'input[name="firstName"]',
            'input[data-automation-id="firstName"]'
          ],
          last_name: [
            'input[name="lastName"]',
            'input[data-automation-id="lastName"]'
          ],
          email: [
            'input[name="email"]',
            'input[type="email"]',
            'input[data-automation-id="email"]'
          ],
          phone: [
            'input[name="phone"]',
            'input[type="tel"]',
            'input[data-automation-id="phone"]'
          ],
          location: [
            'input[name="location"]',
            'input[data-automation-id="location"]'
          ],
          linkedin: [
            'input[name="linkedinUrl"]',
            'input[data-automation-id="linkedinUrl"]'
          ],
          portfolio: [
            'input[name="website"]',
            'input[data-automation-id="website"]'
          ],
          resume_upload: [
            'input[type="file"][accept*="pdf"]',
            'input[data-automation-id="resume"]'
          ],
          cover_letter: [
            'textarea[name="coverLetter"]',
            'textarea[data-automation-id="coverLetter"]'
          ]
        },
        navigation: {
          next_button: [
            'button:has-text("Next")',
            'button[data-automation-id="next-button"]'
          ],
          submit_button: [
            'button:has-text("Submit")',
            'button[data-automation-id="submit-button"]'
          ],
          back_button: [
            'button:has-text("Back")',
            'button[data-automation-id="back-button"]'
          ]
        },
        captcha: {
          indicators: [
            'text=verify you\'re human',
            'text=security check'
          ],
          iframe_selectors: [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]'
          ]
        }
      },
      quirks: [
        'Complex multi-step process',
        'High CAPTCHA likelihood',
        'May require account creation',
        'Company-specific application fields'
      ],
      rate_limit: {
        max_per_hour: 2,
        max_per_day: 5,
        min_delay: 120,
        max_delay: 300
      }
    };

    // Generic forms
    const genericProfile: JobBoardProfile = {
      id: 'generic',
      name: 'Generic Forms',
      domain: '.*',
      enabled: true,
      captcha_likelihood: 'low',
      navigation_flow: 'single_page',
      custom_selectors: {
        apply_button: [
          'button:has-text("Apply")',
          'button:has-text("Submit")',
          'input[type="submit"]',
          'a:has-text("Apply")'
        ],
        form_container: [
          'form',
          '.application-form',
          '.job-application'
        ],
        fields: {
          first_name: [
            'input[name*="first"]',
            'input[id*="first"]',
            'input[placeholder*="first"]'
          ],
          last_name: [
            'input[name*="last"]',
            'input[id*="last"]',
            'input[placeholder*="last"]'
          ],
          email: [
            'input[type="email"]',
            'input[name*="email"]',
            'input[id*="email"]'
          ],
          phone: [
            'input[type="tel"]',
            'input[name*="phone"]',
            'input[id*="phone"]'
          ],
          location: [
            'input[name*="location"]',
            'input[name*="city"]',
            'input[id*="location"]'
          ],
          linkedin: [
            'input[name*="linkedin"]',
            'input[id*="linkedin"]'
          ],
          portfolio: [
            'input[name*="website"]',
            'input[name*="portfolio"]',
            'input[id*="website"]'
          ],
          resume_upload: [
            'input[type="file"][accept*="pdf"]',
            'input[name*="resume"]',
            'input[name*="cv"]'
          ],
          cover_letter: [
            'textarea[name*="cover"]',
            'textarea[id*="cover"]',
            'textarea[name*="letter"]'
          ]
        },
        navigation: {
          next_button: [
            'button:has-text("Next")',
            'button:has-text("Continue")',
            'input[type="submit"][value*="Next"]'
          ],
          submit_button: [
            'button:has-text("Submit")',
            'input[type="submit"]',
            'button:has-text("Apply")'
          ],
          back_button: [
            'button:has-text("Back")',
            'a:has-text("Back")'
          ]
        },
        captcha: {
          indicators: [
            'text=verify you\'re human',
            'text=complete the captcha',
            'text=security check'
          ],
          iframe_selectors: [
            'iframe[src*="recaptcha"]',
            'iframe[src*="hcaptcha"]',
            'iframe[src*="captcha"]'
          ]
        }
      },
      quirks: [
        'Fallback for unknown job boards',
        'Uses generic selectors',
        'May not work for complex forms'
      ],
      rate_limit: {
        max_per_hour: 8,
        max_per_day: 30,
        min_delay: 30,
        max_delay: 120
      }
    };

    // Store all profiles
    this.profiles.set('linkedin', linkedinProfile);
    this.profiles.set('indeed', indeedProfile);
    this.profiles.set('greenhouse', greenhouseProfile);
    this.profiles.set('lever', leverProfile);
    this.profiles.set('workday', workdayProfile);
    this.profiles.set('generic', genericProfile);
  }

  getAllProfiles(): JobBoardProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfile(boardId: string): JobBoardProfile | null {
    return this.profiles.get(boardId) || null;
  }

  saveProfile(profile: JobBoardProfile): void {
    this.profiles.set(profile.id, profile);
  }

  detectJobBoard(url: string): JobBoardProfile | null {
    for (const profile of this.profiles.values()) {
      if (profile.enabled) {
        const regex = new RegExp(profile.domain, 'i');
        if (regex.test(url)) {
          return profile;
        }
      }
    }
    return null;
  }

  getEnabledProfiles(): JobBoardProfile[] {
    return this.getAllProfiles().filter(profile => profile.enabled);
  }

  updateProfileStatus(boardId: string, enabled: boolean): void {
    const profile = this.profiles.get(boardId);
    if (profile) {
      profile.enabled = enabled;
      this.profiles.set(boardId, profile);
    }
  }
}
