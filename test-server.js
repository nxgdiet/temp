const http = require('http');

// Test if the server is running
function testServer() {
  const port = process.env.PORT || 8080;
  const host = 'localhost';
  
  console.log(`🧪 Testing server on ${host}:${port}...`);
  
  const req = http.request({
    hostname: host,
    port: port,
    path: '/health',
    method: 'GET',
    timeout: 5000
  }, (res) => {
    console.log(`✅ Server responded with status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      console.log('🎉 Server is healthy and running!');
      process.exit(0);
    } else {
      console.log('❌ Server responded but not healthy');
      process.exit(1);
    }
  });
  
  req.on('error', (error) => {
    console.log(`❌ Server test failed: ${error.message}`);
    process.exit(1);
  });
  
  req.on('timeout', () => {
    console.log('⏰ Server test timed out');
    req.destroy();
    process.exit(1);
  });
  
  req.end();
}

// Run test after a short delay to allow server to start
setTimeout(testServer, 2000); 