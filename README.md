# Web Scraper API

A powerful Express.js REST API for web scraping with Playwright, designed for serverless deployment on Vercel.

## Features

- 🚀 **Full JavaScript Rendering**: Uses Playwright to handle SPAs and dynamic content
- 🔗 **Link Extraction**: Extracts all clickable elements (anchors and buttons) with their text and URLs
- 📄 **HTML & Markdown**: Returns both full HTML source and clean Markdown conversion
- 🛡️ **Security**: Input validation, CORS support, and security headers
- ☁️ **Serverless Ready**: Optimized for Vercel deployment
- ⚡ **Fast**: Efficient browser management with proper resource cleanup

## API Endpoints

### POST /api/scrape (or /scrape)

Scrapes a website and returns structured data.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "links": [
    {
      "text": "Link Text",
      "href": "https://example.com/page",
      "type": "anchor"
    },
    {
      "text": "Button Text", 
      "href": "#",
      "type": "button"
    }
  ],
  "html": "<html>...</html>",
  "markdown": "# Page Title\n\nContent...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "linksCount": 25
}
```

### GET /api/health (or /health)

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scraper-js
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

4. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:3000`

## Usage Examples

### Using curl
```bash
curl -X POST https://your-domain.vercel.app/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Using JavaScript fetch
```javascript
const response = await fetch('https://your-domain.vercel.app/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  })
});

const data = await response.json();
console.log(data);
```

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

The API will be automatically deployed with Playwright support.

### Environment Variables

- `PORT`: Server port (default: 3000)
- `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD`: Set to "1" for Vercel deployment

## Error Handling

The API handles various error scenarios:

- **400**: Invalid URL or validation errors
- **404**: URL not found or domain doesn't exist
- **408**: Request timeout (page load > 30 seconds)
- **503**: Connection refused by target server
- **526**: SSL certificate errors
- **500**: Internal server errors

## Security Features

- URL validation and sanitization
- Local/private IP blocking
- CORS support
- Security headers via Helmet
- Request timeout protection
- Resource cleanup

## Technical Details

- **Framework**: Express.js
- **Browser Engine**: Playwright (Chromium)
- **HTML to Markdown**: Turndown
- **Validation**: express-validator
- **Security**: Helmet, CORS

## License

ISC
