const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

async function testAuthMe() {
  console.log('=== TESTING /auth/me ENDPOINT ===\n');

  try {
    console.log('1. Registering test user...');
    const registerData = {
      role: 'student',
      firstName: 'AuthMe',
      lastName: 'Test',
      email: `authme${Date.now()}@example.com`,
      password: 'password123',
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData, {
      withCredentials: true,
    });

    console.log('Registration successful');
    console.log(
      '   User:',
      registerResponse.data.user.firstName,
      registerResponse.data.user.lastName
    );

    const cookies = registerResponse.headers['set-cookie'];
    if (cookies && cookies.some((cookie) => cookie.includes('token='))) {
      console.log('Authentication cookie set');

      const cookieHeader = cookies.join('; ');

      console.log('\n2. Testing /auth/me endpoint...');
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: {
          Cookie: cookieHeader,
        },
        withCredentials: true,
      });

      console.log('/auth/me endpoint works!');
      console.log('   Response:', JSON.stringify(meResponse.data, null, 2));
    } else {
      console.log('No authentication cookie found');
    }
    console.log('\n3. Testing /auth/me without cookies (should fail)...');
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      console.log('Should have failed without cookies');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Correctly returns 401 without authentication');
      } else {
        console.log('Unexpected error:', error.response?.status, error.response?.data);
      }
    }
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAuthMe();
