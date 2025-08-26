const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api/v1';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAuthenticationTests() {
  console.log('=== COMPREHENSIVE AUTHENTICATION TEST ===\n');

  const timestamp = Date.now();
  const testEmail = `testuser${timestamp}@example.com`;

  console.log(`Test email: ${testEmail}`);
  console.log('Starting tests...\n');

  let testsPassed = 0;
  let totalTests = 0;

  function logTest(testName, success, message) {
    totalTests++;
    if (success) {
      testsPassed++;
      console.log(`Passed ${testName}: ${message}`);
    } else {
      console.log(`Failed ${testName}: ${message}`);
    }
  }

  try {
    console.log('--- STEP 1: USER REGISTRATION ---');
    const registerData = {
      role: 'student',
      firstName: 'Test',
      lastName: 'User',
      email: testEmail,
      password: 'originalpassword123',
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    logTest('Registration', true, registerResponse.data.message);
    console.log(`   User ID: ${registerResponse.data.user.id}`);
    console.log(
      `   Name: ${registerResponse.data.user.firstName} ${registerResponse.data.user.lastName}`
    );
    console.log(`   Role: ${registerResponse.data.user.role}`);
  } catch (error) {
    logTest('Registration', false, error.response?.data?.message || error.message);
    console.log('Registration failed - stopping tests');
    return;
  }

  try {
    console.log('\n--- STEP 2: LOGIN WITH ORIGINAL PASSWORD ---');
    const loginData = {
      email: testEmail,
      password: 'originalpassword123',
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    logTest('Login with original password', true, loginResponse.data.message);
    logTest(
      'Cookie authentication',
      loginResponse.headers['set-cookie'] &&
        loginResponse.headers['set-cookie'].some((cookie) => cookie.includes('token=')),
      loginResponse.headers['set-cookie'] ? 'Token cookie set' : 'No token cookie set'
    );
  } catch (error) {
    logTest('Login with original password', false, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n--- STEP 3: LOGOUT ---');
    const logoutResponse = await axios.delete(`${BASE_URL}/auth/logout`);
    logTest('Logout', true, logoutResponse.data.message);
  } catch (error) {
    logTest('Logout', false, error.response?.data?.message || error.message);
  }

  try {
    console.log('\n--- STEP 4: REQUEST PASSWORD RESET ---');
    const forgotPasswordData = {
      email: testEmail,
    };

    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, forgotPasswordData);
    logTest('Password reset request', true, forgotResponse.data.message);

    if (forgotResponse.data.resetToken) {
      console.log('   Reset token generated successfully');
      const resetToken = forgotResponse.data.resetToken;

      console.log('\n--- STEP 5: RESET PASSWORD ---');
      const resetPasswordData = {
        resetToken: resetToken,
        newPassword: 'newpassword456',
      };

      const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, resetPasswordData);
      logTest('Password reset', true, resetResponse.data.message);

      console.log('\n--- STEP 6: VERIFY OLD PASSWORD REJECTED ---');
      try {
        const oldLoginData = {
          email: testEmail,
          password: 'originalpassword123',
        };
        await axios.post(`${BASE_URL}/auth/login`, oldLoginData);
        logTest('Old password rejection', false, 'Old password should not work');
      } catch (_error) {
        logTest('Old password rejection', true, 'Old password correctly rejected');
      }

      console.log('\n--- STEP 7: VERIFY NEW PASSWORD WORKS ---');
      await delay(2000);
      try {
        const newLoginData = {
          email: testEmail,
          password: 'newpassword456',
        };
        const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, newLoginData);
        logTest('New password login', true, 'Login with new password successful');
        logTest(
          'New password authentication',
          newLoginResponse.headers['set-cookie'] &&
            newLoginResponse.headers['set-cookie'].some((cookie) => cookie.includes('token=')),
          'Token cookie set for new password'
        );
      } catch (error) {
        logTest('New password login', false, error.response?.data?.message || error.message);
      }

      console.log('\n--- STEP 8: FINAL LOGOUT ---');
      try {
        const finalLogoutResponse = await axios.delete(`${BASE_URL}/auth/logout`);
        logTest('Final logout', true, finalLogoutResponse.data.message);
      } catch (error) {
        logTest('Final logout', false, error.response?.data?.message || error.message);
      }
    } else {
      logTest('Reset token generation', false, 'No reset token received');
    }
  } catch (error) {
    logTest('Password reset flow', false, error.response?.data?.message || error.message);
  }

  console.log('\n=== TEST SUMMARY ===');
  console.log(`Tests passed: ${testsPassed}/${totalTests}`);
  console.log(`Success rate: ${((testsPassed / totalTests) * 100).toFixed(1)}%`);
  console.log(`Test user: ${testEmail}`);

  if (testsPassed === totalTests) {
    console.log('\nAll tests PASSED! Authentication system is working correctly.');
  } else {
    console.log('\nSome tests FAILED. Check the logs above for details.');
  }
}

async function testExistingUserFlow() {
  console.log('\n=== EXISTING USER TEST ===');

  const existingEmail = 'test@example.com';

  try {
    console.log('Testing registration with existing email...');
    const registerData = {
      role: 'student',
      firstName: 'Duplicate',
      lastName: 'User',
      email: existingEmail,
      password: 'password123',
    };

    await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('Expected error for duplicate email');
  } catch (error) {
    if (error.response?.data?.message === 'User already exists') {
      console.log('Duplicate email correctly rejected');
    } else {
      console.log('Unexpected error:', error.response?.data?.message);
    }
  }
}

async function runAllTests() {
  try {
    await runAuthenticationTests();
    await testExistingUserFlow();
  } catch (error) {
    console.error('Test suite error:', error.message);
  }
}

runAllTests();
