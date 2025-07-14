const axios = require('axios');

async function testLocalAPI() {
  try {
    console.log('Testing local API...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('Health check:', healthResponse.data);
    
    // Test scrape endpoint
    const scrapeResponse = await axios.post('http://localhost:3000/scrape', {
      url: 'https://example.com'
    });
    
    console.log('Scrape test successful!');
    console.log('Links found:', scrapeResponse.data.linksCount);
    console.log('First few links:', scrapeResponse.data.links.slice(0, 3));
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testLocalAPI();
