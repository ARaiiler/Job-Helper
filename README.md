# Job Tracker Pro

AI-powered job application automation with resume tailoring, browser automation, and comprehensive analytics.

## Features

- **Profile Management**: Complete professional profile with experience, education, skills, and certifications
- **Job Tracking**: Organize and track job applications with status management
- **AI-Powered Analysis**: Automatic job requirement extraction and skills matching
- **Resume Tailoring**: RAG-based resume customization for each application
- **Browser Automation**: Automatic form filling with CAPTCHA detection and manual assist
- **Batch Processing**: Process multiple applications with rate limiting and error recovery
- **Analytics Dashboard**: Comprehensive insights and performance metrics
- **Export/Import**: Data backup and migration capabilities
- **Cross-Platform**: Windows, macOS, and Linux support

## Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for AI features)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd projectB
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers** (for automation)
   ```bash
   npx playwright install
   ```

## Development

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Build for production**
   ```bash
   npm run build
   ```

3. **Run tests**
   ```bash
   npm test
   npm run test:e2e
   ```

## Building Distributables

1. **Build for all platforms**
   ```bash
   npm run dist
   ```

2. **Build for specific platform**
   ```bash
   npm run dist:win    # Windows
   npm run dist:mac    # macOS  
   npm run dist:linux  # Linux
   ```

## Configuration

### OpenAI API Key
1. Go to Settings in the app
2. Enter your OpenAI API key
3. Test the connection
4. AI features will be enabled

### Browser Automation
1. Configure automation settings in Settings
2. Set screenshot directory
3. Configure timeouts and delays
4. Enable/disable specific job boards

## Usage

### First Time Setup
1. **Create Profile**: Fill in your personal information, work experience, education, skills, and certifications
2. **Configure AI**: Enter your OpenAI API key in Settings
3. **Add Jobs**: Start adding job applications to track

### Job Application Workflow
1. **Add Job**: Enter company, position, and job URL
2. **AI Analysis**: Let the AI analyze job requirements and calculate match score
3. **Resume Tailoring**: Generate tailored resume content for the job
4. **Automation**: Use browser automation to fill application forms
5. **Track Progress**: Monitor application status and responses

### Batch Processing
1. **Select Jobs**: Choose multiple jobs for batch processing
2. **Configure Settings**: Set delays, rate limits, and error handling
3. **Start Batch**: Process applications automatically
4. **Monitor Progress**: Track real-time progress and handle errors

### Analytics
1. **View Dashboard**: See application trends and success rates
2. **Job Board Performance**: Compare success across different platforms
3. **Insights**: Get AI-powered recommendations for optimization

## Keyboard Shortcuts

- `Ctrl+N`: New Job
- `Ctrl+S`: Save
- `Ctrl+F`: Search
- `Ctrl+,`: Settings
- `Ctrl+Shift+D`: Toggle Dark Mode
- `Delete`: Delete selected item

## Data Management

### Export Data
- **Complete Backup**: Export all data as JSON
- **Applications CSV**: Export job applications for analysis
- **Resume PDF**: Generate professional resume

### Import Data
- **Restore Backup**: Import previously exported data
- **Data Validation**: Automatic validation of imported data

## Troubleshooting

### Common Issues

1. **AI Features Not Working**
   - Check OpenAI API key in Settings
   - Ensure sufficient API credits
   - Verify internet connection

2. **Automation Fails**
   - Check browser automation settings
   - Try manual assist mode for CAPTCHA
   - Update Playwright browsers

3. **Performance Issues**
   - Clear old automation logs
   - Use pagination for large job lists
   - Close unused browser tabs

### Error Logs
- View error logs in Settings > Error Logs
- Export logs for support
- Check error statistics and patterns

## Privacy & Security

- **Local Storage**: All data stored locally on your device
- **No Tracking**: No analytics or tracking services
- **Encrypted Keys**: API keys encrypted and stored securely
- **No Cloud Sync**: Complete user control over data

## Support

- **Documentation**: Check `docs/` folder for detailed guides
- **Error Reporting**: Use error logs for debugging
- **Data Backup**: Regular exports recommended

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

---

**Version**: 1.0.0  (BETA)
**Last Updated**: 23/10/2025