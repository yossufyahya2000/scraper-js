const axios = require('axios');

// Simple test script for the scraper API
async function testScraper() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Web Scraper API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test scraping a simple website
    console.log('2. Testing scrape endpoint with httpbin.org...');
    const scrapeResponse = await axios.post(`${baseUrl}/scrape`, {
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
      await axios.post(`${baseUrl}/scrape`, {
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

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testScraper();
}

module.exports = testScraper;
