/**
 * Test script to verify frontend-backend authentication integration
 * This tests all the real API endpoints we've connected
 */

import { authService } from '../services/auth.service';

export class AuthIntegrationTest {
  private testResults: { [key: string]: boolean } = {};

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Authentication Integration Tests...\n');

    // Test 1: Health Check
    await this.testHealthCheck();

    // Test 2: Login with test credentials
    await this.testLogin();

    // Test 3: Get current user
    await this.testGetCurrentUser();

    // Test 4: Verify token
    await this.testVerifyToken();

    // Test 5: Refresh token
    await this.testRefreshToken();

    // Test 6: Logout
    await this.testLogout();

    // Print results
    this.printResults();
  }

  private async testHealthCheck(): Promise<void> {
    try {
      console.log('🔍 Testing Health Check...');
      const isHealthy = await authService.healthCheck();
      this.testResults['healthCheck'] = isHealthy;
      console.log(`✅ Health Check: ${isHealthy ? 'PASS' : 'FAIL'}\n`);
    } catch (error) {
      console.log(`❌ Health Check: FAIL - ${error}\n`);
      this.testResults['healthCheck'] = false;
    }
  }

  private async testLogin(): Promise<void> {
    try {
      console.log('🔍 Testing Login...');
      
      // Use test credentials
      const response = await authService.login('test@example.com', 'TestPassword123');
      
      this.testResults['login'] = response.success;
      console.log(`✅ Login: ${response.success ? 'PASS' : 'FAIL'}`);
      console.log(`   Response: ${JSON.stringify(response, null, 2)}\n`);
    } catch (error: any) {
      console.log(`❌ Login: FAIL - ${error.message || error}\n`);
      this.testResults['login'] = false;
    }
  }

  private async testGetCurrentUser(): Promise<void> {
    try {
      console.log('🔍 Testing Get Current User...');
      
      const response = await authService.getCurrentUser();
      
      this.testResults['getCurrentUser'] = response.success;
      console.log(`✅ Get Current User: ${response.success ? 'PASS' : 'FAIL'}`);
      console.log(`   Response: ${JSON.stringify(response, null, 2)}\n`);
    } catch (error: any) {
      console.log(`❌ Get Current User: FAIL - ${error.message || error}\n`);
      this.testResults['getCurrentUser'] = false;
    }
  }

  private async testVerifyToken(): Promise<void> {
    try {
      console.log('🔍 Testing Verify Token...');
      
      const response = await authService.verifyToken();
      
      this.testResults['verifyToken'] = response.success;
      console.log(`✅ Verify Token: ${response.success ? 'PASS' : 'FAIL'}`);
      console.log(`   Response: ${JSON.stringify(response, null, 2)}\n`);
    } catch (error: any) {
      console.log(`❌ Verify Token: FAIL - ${error.message || error}\n`);
      this.testResults['verifyToken'] = false;
    }
  }

  private async testRefreshToken(): Promise<void> {
    try {
      console.log('🔍 Testing Refresh Token...');
      
      const response = await authService.refreshToken();
      
      this.testResults['refreshToken'] = response.success;
      console.log(`✅ Refresh Token: ${response.success ? 'PASS' : 'FAIL'}`);
      console.log(`   Response: ${JSON.stringify(response, null, 2)}\n`);
    } catch (error: any) {
      console.log(`❌ Refresh Token: FAIL - ${error.message || error}\n`);
      this.testResults['refreshToken'] = false;
    }
  }

  private async testLogout(): Promise<void> {
    try {
      console.log('🔍 Testing Logout...');
      
      await authService.logout();
      
      this.testResults['logout'] = true;
      console.log(`✅ Logout: PASS\n`);
    } catch (error: any) {
      console.log(`❌ Logout: FAIL - ${error.message || error}\n`);
      this.testResults['logout'] = false;
    }
  }

  private printResults(): void {
    console.log('📊 Test Results Summary:');
    console.log('========================');
    
    let passCount = 0;
    let totalCount = 0;
    
    Object.entries(this.testResults).forEach(([testName, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASS' : 'FAIL'}`);
      if (passed) passCount++;
      totalCount++;
    });
    
    console.log(`\n📈 Overall: ${passCount}/${totalCount} tests passed`);
    
    if (passCount === totalCount) {
      console.log('🎉 All authentication integration tests passed!');
    } else {
      console.log('⚠️  Some tests failed. Check backend server and database connection.');
    }
  }
}

// Export test runner function
export const runAuthIntegrationTests = async (): Promise<void> => {
  const tester = new AuthIntegrationTest();
  await tester.runAllTests();
};

// For browser console testing
if (typeof window !== 'undefined') {
  (window as any).runAuthTests = runAuthIntegrationTests;
  console.log('🧪 Auth integration tests loaded! Run window.runAuthTests() to start testing.');
}
