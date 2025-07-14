const express = require('express');
const chromiumPkg = require('@sparticuz/chromium');
const { chromium: playwrightChromium } = require('playwright-core');
const { chromium } = require('playwright'); // Fallback for local development
const TurndownService = require('turndown');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// URL validation middleware
const validateUrl = [
  body('url')
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Please provide a valid HTTP or HTTPS URL')
    .isLength({ max: 2048 })
    .withMessage('URL is too long')
    .custom((value) => {
      // Additional security checks
      const url = new URL(value);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.') || url.hostname.startsWith('172.')) {
        throw new Error('Local URLs are not allowed');
      }
      return true;
    })
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main scraping endpoint
app.post('/scrape', validateUrl, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { url } = req.body;
  let browser = null;
  let page = null;

  try {
    // Launch browser - use @sparticuz/chromium for serverless, regular chromium for local
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      browser = await playwrightChromium.launch({
        args: chromiumPkg.args,
        defaultViewport: chromiumPkg.defaultViewport,
        executablePath: await chromiumPkg.executablePath(),
        headless: chromiumPkg.headless
      });
    } else {
      browser = await chromium.launch({
        headless: true,
        timeout: 60000,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });

    page = await context.newPage();

    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });

    // Navigate to the URL with timeout and better error handling
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for network to be idle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      // Continue if networkidle times out
      console.log('Network idle timeout, continuing...');
    }

    // Wait for additional dynamic content
    await page.waitForTimeout(2000);

    // Extract clickable elements (links and buttons)
    const links = await page.evaluate(() => {
      const elements = [];
      
      // Extract anchor tags
      const anchors = document.querySelectorAll('a[href]');
      anchors.forEach(anchor => {
        const text = anchor.textContent?.trim() || '';
        const href = anchor.href;
        if (text && href) {
          elements.push({
            text: text,
            href: href,
            type: 'anchor'
          });
        }
      });

      // Extract buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const text = button.textContent?.trim() || '';
        const action = button.getAttribute('onclick') || button.getAttribute('data-action') || '';
        if (text) {
          elements.push({
            text: text,
            href: action || '#',
            type: 'button'
          });
        }
      });

      return elements;
    });

    // Get the full HTML content
    const html = await page.content();

    // Convert HTML to Markdown
    const markdown = turndownService.turndown(html);

    // Prepare response
    const response = {
      url: url,
      links: links,
      html: html,
      markdown: markdown,
      timestamp: new Date().toISOString(),
      linksCount: links.length
    };

    res.json(response);

  } catch (error) {
    console.error('Scraping error:', error);
    
    // Handle specific error types
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.name === 'TimeoutError') {
      statusCode = 408;
      errorMessage = 'Request timeout - the page took too long to load';
    } else if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      statusCode = 404;
      errorMessage = 'URL not found or domain does not exist';
    } else if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
      statusCode = 503;
      errorMessage = 'Connection refused by the target server';
    } else if (error.message.includes('net::ERR_CERT_')) {
      statusCode = 526;
      errorMessage = 'SSL certificate error';
    }

    res.status(statusCode).json({
      error: errorMessage,
      url: url,
      timestamp: new Date().toISOString()
    });

  } finally {
    // Clean up resources
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error('Error closing page:', e);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('Error closing browser:', e);
      }
    }
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Use POST /scrape to scrape a website'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Web Scraper API running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔍 Scrape endpoint: POST http://localhost:${PORT}/scrape`);
  });
}

module.exports = app;
