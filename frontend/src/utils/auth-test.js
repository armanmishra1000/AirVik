/**
 * Auth Test Utilities
 * 
 * This file contains helper functions to test authentication features
 * including token refresh and persistence.
 */

// Test automatic token refresh
export function testTokenRefresh() {
  console.log('=== TOKEN REFRESH TEST ===');
  
  // Get current tokens
  const accessToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  
  if (!accessToken || !refreshToken) {
    console.log('❌ No tokens found. Please login first.');
    return;
  }
  
  console.log('✅ Tokens found in storage');
  
  // Parse JWT tokens to check expiration
  try {
    const accessTokenData = parseJwt(accessToken);
    const refreshTokenData = parseJwt(refreshToken);
    
    const currentTime = Math.floor(Date.now() / 1000);
    const accessTokenExpiry = accessTokenData.exp;
    const refreshTokenExpiry = refreshTokenData.exp;
    
    console.log('Access Token expires in:', formatTimeRemaining(accessTokenExpiry - currentTime));
    console.log('Refresh Token expires in:', formatTimeRemaining(refreshTokenExpiry - currentTime));
    
    // Check if token refresh timer is set
    console.log('Checking for token refresh timer...');
    
    // Force token refresh for testing
    console.log('Forcing token refresh for testing...');
    const authService = window._getAuthService ? window._getAuthService() : null;
    
    if (authService && typeof authService.performTokenRefresh === 'function') {
      authService.performTokenRefresh()
        .then(result => {
          console.log('✅ Token refresh successful:', result);
          
          // Check if tokens were updated
          const newAccessToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
          if (newAccessToken !== accessToken) {
            console.log('✅ Access token was updated');
          } else {
            console.log('❌ Access token was not updated');
          }
        })
        .catch(error => {
          console.log('❌ Token refresh failed:', error);
        });
    } else {
      console.log('❌ Auth service not available or performTokenRefresh method not found');
    }
  } catch (error) {
    console.log('❌ Error parsing tokens:', error);
  }
}

// Test authentication persistence
export function testAuthPersistence() {
  console.log('=== AUTH PERSISTENCE TEST ===');
  
  // Check if tokens exist in storage
  const accessToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  
  if (!accessToken || !refreshToken) {
    console.log('❌ No tokens found. Please login first.');
    return;
  }
  
  console.log('✅ Tokens found in storage');
  
  // Check if user data is cached
  const userCache = localStorage.getItem('user_cache');
  if (userCache) {
    console.log('✅ User data is cached');
    try {
      const userData = JSON.parse(userCache);
      console.log('User data:', userData);
    } catch (error) {
      console.log('❌ Error parsing user data:', error);
    }
  } else {
    console.log('❌ User data is not cached');
  }
  
  // Check if auth context is initialized
  console.log('Checking if auth context is initialized...');
  const authContext = window._getAuthContext ? window._getAuthContext() : null;
  
  if (authContext) {
    console.log('✅ Auth context is available');
    console.log('Auth state:', authContext.state);
    console.log('Is authenticated:', authContext.state.isAuthenticated);
    console.log('Is loading:', authContext.state.loading);
    console.log('User:', authContext.state.user);
  } else {
    console.log('❌ Auth context is not available');
  }
}

// Test token expiration handling
export function testTokenExpiration() {
  console.log('=== TOKEN EXPIRATION TEST ===');
  
  // Get auth service
  const authService = window._getAuthService ? window._getAuthService() : null;
  
  if (!authService) {
    console.log('❌ Auth service not available');
    return;
  }
  
  console.log('✅ Auth service is available');
  
  // Simulate token expiration
  console.log('Simulating token expiration...');
  
  if (typeof authService.handleTokenExpiration === 'function') {
    // Backup current location to restore after test
    const currentLocation = window.location.href;
    
    // Override window.location.href to prevent actual redirect
    const originalWindowLocation = window.location;
    delete window.location;
    window.location = { ...originalWindowLocation, href: currentLocation };
    
    // Call handleTokenExpiration
    try {
      authService.handleTokenExpiration();
      console.log('✅ handleTokenExpiration called successfully');
      
      // Check if tokens were cleared
      const accessToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
      
      if (!accessToken && !refreshToken) {
        console.log('✅ Tokens were cleared');
      } else {
        console.log('❌ Tokens were not cleared');
      }
      
      // Check if redirect was attempted
      if (window.location.href !== currentLocation) {
        console.log('✅ Redirect was attempted to:', window.location.href);
      } else {
        console.log('❌ No redirect was attempted');
      }
      
      // Restore original window.location
      window.location = originalWindowLocation;
      
      console.log('Test completed. Please reload the page to restore authentication state.');
    } catch (error) {
      console.log('❌ Error during token expiration test:', error);
      window.location = originalWindowLocation;
    }
  } else {
    console.log('❌ handleTokenExpiration method not found');
  }
}

// Helper function to parse JWT token
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

// Helper function to format time remaining
function formatTimeRemaining(seconds) {
  if (seconds <= 0) {
    return 'Expired';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

// Make functions available globally for testing in console
if (typeof window !== 'undefined') {
  window.authTest = {
    testTokenRefresh,
    testAuthPersistence,
    testTokenExpiration,
    parseJwt
  };
}
