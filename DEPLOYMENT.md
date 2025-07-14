# Deployment Guide

## Vercel Deployment

This API is optimized for Vercel serverless deployment with the following structure:

### Project Structure
```
├── api/
│   ├── index.js      # Main documentation page
│   ├── health.js     # Health check endpoint
│   └── scrape.js     # Main scraping endpoint
├── package.json
├── vercel.json       # Vercel configuration
└── README.md
```

### API Endpoints

After deployment, your API will be available at:

- **GET** `/` - API documentation page
- **GET** `/api/health` - Health check
- **POST** `/api/scrape` - Web scraping endpoint

### Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new one
   - Choose your project name
   - Confirm deployment

4. **Test your deployment**:
   ```bash
   node test-vercel.js https://your-domain.vercel.app
   ```

### Environment Variables

The following environment variables are automatically set by the `vercel.json` configuration:

- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` - Prevents downloading browsers during build

### Configuration Details

The `vercel.json` file includes:

- **buildCommand**: Installs dependencies and Playwright browsers
- **functions**: Sets maximum duration for the scraping function (30 seconds)
- **rewrites**: Creates clean URLs without `/api` prefix

### Troubleshooting

#### "Method Not Allowed" Error
- Make sure you're using POST for `/scrape` endpoint
- Check that your request includes proper `Content-Type: application/json` header

#### Timeout Errors
- The scraping function has a 30-second timeout limit
- Complex pages may take longer to load
- Consider using simpler target URLs for testing

#### Browser Launch Errors
- Playwright browsers are automatically installed during deployment
- If you see browser-related errors, try redeploying

### Testing Your Deployment

Use the provided test script:

```bash
# Test your deployed API
node test-vercel.js https://your-domain.vercel.app
```

Or test manually with curl:

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Scrape a website
curl -X POST https://your-domain.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Performance Notes

- First request may be slower due to cold start
- Subsequent requests will be faster
- Browser instances are created fresh for each request
- Maximum function duration is 30 seconds

### Security Features

- CORS headers are properly configured
- URL validation prevents local/private IP access
- Input sanitization for all parameters
- Proper error handling and logging
