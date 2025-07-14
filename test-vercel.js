const axios = require('axios');

// Test script for the Vercel-deployed scraper API
async function testVercelAPI() {
  // Replace with your actual Vercel domain
  const baseUrl = process.argv[2] || 'https://your-domain.vercel.app';
  
  console.log(`🧪 Testing Vercel-deployed Web Scraper API at ${baseUrl}...\n`);

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test scraping a simple website
    console.log('2. Testing scrape endpoint with httpbin.org...');
    const scrapeResponse = await axios.post(`${baseUrl}/api/scrape`, {
      url: 'https://httpbin.org/html'
    });
    
    const data = scrapeResponse.data;
    console.log('✅ Scrape successful!');
    console.log(`📊 Found ${data.linksCount} links`);
    console.log(`📄 HTML length: ${data.html.length} characters`);
    console.log(`📝 Markdown length: ${data.markdown.length} characters`);
    console.log('');

    // Show first few links
    if (data.links.length > 0) {
      console.log('🔗 First few links found:');
      data.links.slice(0, 3).forEach((link, index) => {
        console.log(`   ${index + 1}. [${link.type}] ${link.text} -> ${link.href}`);
      });
      console.log('');
    }

    // Test invalid URL
    console.log('3. Testing invalid URL handling...');
    try {
      await axios.post(`${baseUrl}/api/scrape`, {
        url: 'not-a-valid-url'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid URL properly rejected');
        console.log('');
      } else {
        throw error;
      }
    }

    // Test method not allowed
    console.log('4. Testing method not allowed...');
    try {
      await axios.get(`${baseUrl}/api/scrape`);
    } catch (error) {
      if (error.response && error.response.status === 405) {
        console.log('✅ GET method properly rejected');
        console.log('');
      } else {
        throw error;
      }
    }

    console.log('🎉 All tests passed!');
    console.log(`\n📋 API Documentation: ${baseUrl}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  if (process.argv.length < 3) {
    console.log('Usage: node test-vercel.js <your-vercel-domain>');
    console.log('Example: node test-vercel.js https://my-scraper.vercel.app');
    process.exit(1);
  }
  testVercelAPI();
}

module.exports = testVercelAPI;
