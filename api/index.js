module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/html');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are allowed'
    });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Scraper API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        .endpoint {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .method {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
        }
        .post { background: #28a745; color: white; }
        .get { background: #007bff; color: white; }
        pre {
            background: #f1f3f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            background: #28a745;
            color: white;
            font-size: 12px;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Web Scraper API</h1>
        <p>Powerful web scraping with Playwright - Extract links, HTML, and Markdown</p>
        <div class="status">✅ Online</div>
    </div>

    <div class="endpoint">
        <h2><span class="method post">POST</span> /api/scrape</h2>
        <p>Scrape a website and extract structured data including links, HTML, and Markdown.</p>
        
        <h3>Request Body:</h3>
        <pre>{
  "url": "https://example.com"
}</pre>

        <h3>Response:</h3>
        <pre>{
  "url": "https://example.com",
  "links": [
    {
      "text": "Link Text",
      "href": "https://example.com/page",
      "type": "anchor"
    }
  ],
  "html": "&lt;html&gt;...&lt;/html&gt;",
  "markdown": "# Page Title\\n\\nContent...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "linksCount": 25
}</pre>
    </div>

    <div class="endpoint">
        <h2><span class="method get">GET</span> /api/health</h2>
        <p>Health check endpoint to verify API status.</p>
        
        <h3>Response:</h3>
        <pre>{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Web Scraper API",
  "version": "1.0.0"
}</pre>
    </div>

    <div class="endpoint">
        <h2>🧪 Test the API</h2>
        <p>Try scraping a website:</p>
        <pre>curl -X POST ${req.headers.host ? `https://${req.headers.host}` : 'https://your-domain.vercel.app'}/api/scrape \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com"}'</pre>
    </div>

    <div class="endpoint">
        <h2>📋 Features</h2>
        <ul>
            <li>🚀 <strong>Full JavaScript Rendering</strong> - Handles SPAs and dynamic content</li>
            <li>🔗 <strong>Link Extraction</strong> - Extracts all clickable elements with text and URLs</li>
            <li>📄 <strong>HTML & Markdown</strong> - Returns both full HTML and clean Markdown</li>
            <li>🛡️ <strong>Security</strong> - Input validation and security headers</li>
            <li>☁️ <strong>Serverless</strong> - Optimized for Vercel deployment</li>
            <li>⚡ <strong>Fast</strong> - Efficient browser management</li>
        </ul>
    </div>

    <footer style="text-align: center; margin-top: 40px; padding: 20px; color: #666;">
        <p>Web Scraper API v1.0.0 | Powered by Playwright</p>
    </footer>
</body>
</html>`;

  res.status(200).send(html);
};
