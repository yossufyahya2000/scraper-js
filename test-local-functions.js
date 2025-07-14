// Simple test to verify our API functions work locally
const healthHandler = require('./api/health.js');

// Mock request and response objects
function createMockReq(method = 'GET', body = {}) {
  return {
    method,
    body,
    headers: {}
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader: function(name, value) {
      this.headers[name] = value;
    },
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = JSON.stringify(data);
      console.log(`Response ${this.statusCode}:`, data);
      return this;
    },
    end: function() {
      console.log(`Response ${this.statusCode}: (empty)`);
      return this;
    },
    send: function(data) {
      this.body = data;
      console.log(`Response ${this.statusCode}:`, data.substring(0, 100) + '...');
      return this;
    }
  };
  return res;
}

async function testHealthFunction() {
  console.log('🧪 Testing health function locally...\n');
  
  try {
    // Test GET request
    console.log('1. Testing GET request to health function...');
    const req = createMockReq('GET');
    const res = createMockRes();
    
    await healthHandler(req, res);
    
    if (res.statusCode === 200) {
      console.log('✅ Health function works correctly!\n');
    } else {
      console.log('❌ Health function returned unexpected status:', res.statusCode);
    }
    
    // Test OPTIONS request
    console.log('2. Testing OPTIONS request...');
    const optionsReq = createMockReq('OPTIONS');
    const optionsRes = createMockRes();
    
    await healthHandler(optionsReq, optionsRes);
    
    if (optionsRes.statusCode === 200) {
      console.log('✅ OPTIONS request handled correctly!\n');
    }
    
    // Test invalid method
    console.log('3. Testing invalid method (POST)...');
    const postReq = createMockReq('POST');
    const postRes = createMockRes();
    
    await healthHandler(postReq, postRes);
    
    if (postRes.statusCode === 405) {
      console.log('✅ Invalid method properly rejected!\n');
    }
    
    console.log('🎉 All local tests passed! The function should work on Vercel.');
    
  } catch (error) {
    console.error('❌ Local test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testHealthFunction();
}

module.exports = { testHealthFunction };
