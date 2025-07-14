const { chromium } = require('playwright');
const TurndownService = require('turndown');

// Initialize Turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// URL validation function
const validateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Check if it's HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    // Check URL length
    if (url.length > 2048) {
      return { valid: false, error: 'URL is too long' };
    }
    
    // Block local/private IPs
    const hostname = urlObj.hostname;
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.')) {
      return { valid: false, error: 'Local URLs are not allowed' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are allowed'
    });
  }

  const { url } = req.body;

  // Validate URL
  if (!url) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{ msg: 'URL is required', param: 'url' }]
    });
  }

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [{ msg: validation.error, param: 'url' }]
    });
  }

  let browser = null;
  let page = null;

  try {
    // Launch browser with optimized settings for serverless
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

    res.status(200).json(response);

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
};
