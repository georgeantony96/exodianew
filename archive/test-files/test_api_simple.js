// Simple API test to check if endpoint exists
async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    const response = await fetch('http://localhost:3000/api/evidence-simulate', {
      method: 'GET',
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (response.status === 405) {
      console.log('✅ Endpoint exists - returns 405 Method Not Allowed for GET (expected)');
    } else {
      const text = await response.text();
      console.log('Response text:', text);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();