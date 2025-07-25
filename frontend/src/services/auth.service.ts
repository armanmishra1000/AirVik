import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { 
  RegisterRequest, 
  VerifyEmailRequest, 
  ResendVerificationRequest, 
  UpdateProfileRequest,
  User, 
  ApiResponse, 
  AuthError,
  ApiConfig,
  LoginRequest,
  LoginResponse,
  TokenPair,
  ChangePasswordRequest,
  RequestPasswordResetRequest,
  PasswordResetRequest,
  DeleteAccountRequest,
  AdminUserUpdateRequest,
  UserSearchParams
} from '../types/auth.types';

// API configuration
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  version: 'v1',
  // Token refresh settings
  tokenRefreshThreshold: 5 * 60, // Refresh token 5 minutes before expiry (in seconds)
  tokenRefreshRetryDelay: 5000, // 5 seconds delay between refresh attempts
  maxRefreshRetries: 3 // Maximum number of refresh attempts
};

export class AuthService {
  private api: AxiosInstance;
  private retryCount = 0;
  private maxRetries = API_CONFIG.retryAttempts;
  private refreshRetryCount = 0;
  private maxRefreshRetries = API_CONFIG.maxRefreshRetries;
  private refreshTokenPromise: Promise<ApiResponse<TokenPair>> | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.api = this.createApiInstance();
    this.setupInterceptors();
    this.initializeAuthPersistence();
  }

  /**
   * Create axios instance with base configuration
   */
  private createApiInstance(): AxiosInstance {
    return axios.create({
      baseURL: API_CONFIG.baseUrl,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Initialize authentication persistence across browser sessions
   */
  private initializeAuthPersistence(): void {
    if (typeof window === 'undefined') return;
    
    // Check for stored tokens and setup automatic refresh if available
    const accessToken = this.getAuthToken();
    const refreshToken = this.getRefreshToken();
    
    if (accessToken && refreshToken) {
      const tokens: TokenPair = {
        accessToken: {
          token: accessToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString() // Default 1 hour
        },
        refreshToken: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 604800000).toISOString() // Default 7 days
        }
      };
      
      // Setup token refresh timer for existing tokens
      this.setupTokenRefreshTimer(tokens);
      
      // Check if token is about to expire and refresh proactively
      if (this.isTokenExpiringSoon(accessToken)) {
        console.log('Token is expiring soon, refreshing proactively');
        this.performTokenRefresh().catch(error => {
          console.error('Proactive token refresh failed:', error);
        });
      }
    }
    
    // Setup storage event listener for multi-tab synchronization
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }
  
  /**
   * Handle storage changes for multi-tab synchronization
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === 'auth_token' || event.key === 'refresh_token') {
      // Token changed in another tab, refresh current tab's state
      if (event.newValue === null) {
        // Token was removed in another tab, clear local auth
        this.clearAuthData();
      } else {
        // Token was updated in another tab, update local state
        const accessToken = this.getAuthToken();
        const refreshToken = this.getRefreshToken();
        
        if (accessToken && refreshToken) {
          const tokens: TokenPair = {
            accessToken: {
              token: accessToken,
              expiresAt: new Date(Date.now() + 3600000).toISOString()
            },
            refreshToken: {
              token: refreshToken,
              expiresAt: new Date(Date.now() + 604800000).toISOString()
            }
          };
          
          this.setupTokenRefreshTimer(tokens);
        }
      }
    }
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Skip adding auth token for refresh token requests to avoid loops
        const isRefreshRequest = config.url?.includes('/auth/refresh');
        
        // Add authentication token if available and not a refresh request
        if (!isRefreshRequest) {
          const token = this.getAuthToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Timestamp'] = new Date().toISOString();

        // Add API version
        config.headers['X-API-Version'] = API_CONFIG.version;

        // Add client info
        config.headers['X-Client-Type'] = 'web';

        // Log non-refresh requests to avoid excessive logging
        if (!isRefreshRequest) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Process successful response
        if (response.data && response.data.data) {
          // Update local user cache if user data is returned
          if (response.data.data.user) {
            this.updateLocalUserCache(response.data.data.user);
          }
          
          // Setup token refresh timer if tokens are returned
          if (response.data.data.accessToken && response.data.data.refreshToken) {
            this.setupTokenRefreshTimer(response.data.data);
          }
        }
        return response;
      },
      async (error: AxiosError) => {
        // Handle token expiration (401)
        if (error.response?.status === 401) {
          // Skip if this is a refresh token request to avoid infinite loops
          if (error.config?.url?.includes('/auth/refresh')) {
            // Refresh token is invalid or expired, clear auth and redirect to login
            console.log('Refresh token is invalid or expired');
            this.handleTokenExpiration();
            return Promise.reject(error);
          }
          
          // Skip if this request has already been retried to prevent infinite loops
          const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
          if (originalRequest._retry) {
            console.log('Request already retried, giving up');
            this.handleTokenExpiration();
            return Promise.reject(error);
          }
          
          // Mark this request as being retried
          originalRequest._retry = true;
          
          try {
            console.log('Attempting token refresh for 401 error');
            // Try to refresh the token using our centralized refresh method
            const tokens = await this.performTokenRefresh();
            
            if (tokens && tokens.accessToken) {
              console.log('Token refresh successful, retrying original request');
              // Update the authorization header with new token
              if (originalRequest && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${tokens.accessToken.token}`;
                
                // Retry the original request with new token
                return this.api(originalRequest);
              }
            } else {
              console.log('Token refresh failed - no tokens returned');
              this.handleTokenExpiration();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // If refresh fails, clear auth and redirect to login
            console.error('Token refresh failed:', refreshError);
            this.handleTokenExpiration();
            return Promise.reject(error);
          }
        }
        
        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          
          // Create error with retry information
          const authError = this.createAuthError(error, retrySeconds);
          return Promise.reject(authError);
        }
        
        // Handle server errors with retry logic
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          
          console.log(`Retrying request (${this.retryCount}/${this.maxRetries}) after ${delay}ms`);
          
          return new Promise((resolve, reject) => {
            setTimeout(async () => {
              try {
                if (!error.config) {
                  reject(new Error('No request config available for retry'));
                  return;
                }
                // Create a new config object with the proper type
                const retryConfig: AxiosRequestConfig = {
                  ...error.config,
                  headers: {
                    ...error.config.headers,
                    'X-Retry-Attempt': this.retryCount.toString(),
                  },
                };
                const retryResponse = await this.api.request(retryConfig);
                resolve(retryResponse);
              } catch (retryError) {
                reject(retryError);
              }
            }, delay);
          });
        }
        
        // Reset retry counter for next request
        this.retryCount = 0;
        
        // Create standardized error
        const authError = this.createAuthError(error);
        return Promise.reject(authError);
      }
    );
  }

  /**
   * Register new user account
   */
  async registerUser(userData: RegisterRequest): Promise<ApiResponse<User>> {
    try {
      this.validateRegistrationData(userData);
      
      const response = await this.api.post<ApiResponse<User>>('auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      const authError = this.handleApiError(error, 'Registration failed');
      throw authError;
    }
  }

  /**
   * Login user and get JWT tokens
   */
  async login(loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await this.api.post<ApiResponse<LoginResponse>>('auth/login', loginData);
      
      if (response.data.success && response.data.data) {
        // Store tokens based on remember me preference
        const rememberMe = loginData.rememberMe || false;
        this.storeTokens(response.data.data.tokens, rememberMe);
        
        // Update local user cache
        this.updateLocalUserCache(response.data.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      const authError = this.handleApiError(error, 'Login failed');
      throw authError;
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      // Send logout request to server to invalidate refresh token
      const response = await this.api.post<ApiResponse<void>>('auth/logout');
      
      // Clear local authentication data regardless of server response
      this.clearAuthData();
      
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Still clear local data even if server request fails
      this.clearAuthData();
      const authError = this.handleApiError(error, 'Logout failed');
      throw authError;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenPair>> {
    try {
      // Use centralized refresh token method
      const tokens = await this.performTokenRefresh(refreshToken);
      
      if (tokens) {
        return {
          success: true,
          data: tokens,
          message: 'Token refreshed successfully'
        };
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear tokens on refresh error
      this.clearAuthData();
      
      // Convert to standardized error
      const authError = this.handleApiError(error, 'Failed to refresh authentication token');
      
      // Return failed response
      return {
        success: false,
        error: authError.message,
        code: authError.code
      };
    }
  }

  /**
   * Verify user email with token
   */
  async verifyEmail(token: string): Promise<ApiResponse<User>> {
    try {
      if (!token) {
        throw new Error('Verification token is required');
      }

      const response = await this.api.post<ApiResponse<User>>('auth/verify-email', {
      token
    });
      
      // Update local user cache if verification successful
      if (response.data.success && response.data.data) {
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Email verification error:', error);
      const authError = this.handleApiError(error, 'Email verification failed');
      throw authError;
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please provide a valid email address');
      }

      const response = await this.api.post<ApiResponse<void>>('/v1/auth/forgot-password', {
        email
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Password reset request error:', error);
      const authError = this.handleApiError(error, 'Password reset request failed');
      throw authError;
    }
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(token: string): Promise<ApiResponse<{ email: string }>> {
    try {
      if (!token) {
        throw new Error('Reset token is required');
      }

      const response = await this.api.get<ApiResponse<{ email: string }>>(
        `/v1/auth/validate-reset-token?token=${encodeURIComponent(token)}`
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Token validation error:', error);
      const authError = this.handleApiError(error, 'Invalid or expired reset token');
      throw authError;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetData: PasswordResetRequest): Promise<ApiResponse<void>> {
    try {
      if (!resetData.token || !resetData.newPassword) {
        throw new Error('Reset token and new password are required');
      }

      // Validate password strength
      if (resetData.newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await this.api.post<ApiResponse<void>>('/v1/auth/reset-password', resetData);
      
      return response.data;
    } catch (error: any) {
      console.error('Password reset error:', error);
      const authError = this.handleApiError(error, 'Password reset failed');
      throw authError;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
    try {
      if (!email) {
        throw new Error('Email is required');
      }

      const response = await this.api.post<ApiResponse<void>>('/v1/auth/resend-verification', {
        email
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Resend verification error:', error);
      const authError = this.handleApiError(error, 'Failed to resend verification email');
      throw authError;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/v1/users/profile');
      
      // Update local user cache if successful
      if (response.data.success && response.data.data) {
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Get user profile error:', error);
      const authError = this.handleApiError(error, 'Failed to get user profile');
      throw authError;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse<void>> {
    try {
      const { currentPassword, newPassword } = passwordData;
      
      if (!currentPassword || !newPassword) {
        throw new Error('Current password and new password are required');
      }
      
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await this.api.put<ApiResponse<void>>('/v1/users/password', passwordData);
      
      return response.data;
    } catch (error: any) {
      console.error('Change password error:', error);
      const authError = this.handleApiError(error, 'Failed to change password');
      throw authError;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      this.validateProfileUpdateData(userData);

      const response = await this.api.put<ApiResponse<User>>('/v1/users/profile', userData);
      
      // Update local user cache if successful
      if (response.data.success && response.data.data) {
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Update profile error:', error);
      const authError = this.handleApiError(error, 'Failed to update profile');
      throw authError;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(params?: UserSearchParams): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.api.get<ApiResponse<User[]>>('/v1/admin/users', { params });
      return response.data;
    } catch (error: any) {
      console.error('Get all users error:', error);
      const authError = this.handleApiError(error, 'Failed to get users');
      throw authError;
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: string): Promise<ApiResponse<User>> {
    try {
      if (!userId || !role) {
        throw new Error('User ID and role are required');
      }

      const response = await this.api.put<ApiResponse<User>>(`/v1/admin/users/${userId}`, { role });
      
      return response.data;
    } catch (error: any) {
      console.error('Update user role error:', error);
      const authError = this.handleApiError(error, 'Failed to update user role');
      throw authError;
    }
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<User>> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await this.api.put<ApiResponse<User>>(`/v1/admin/users/${userId}`, { isActive });
      
      return response.data;
    } catch (error: any) {
      console.error('Update user status error:', error);
      const authError = this.handleApiError(error, 'Failed to update user status');
      throw authError;
    }
  }

  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get<any>('/health');
      return response.data.status === 'ok';
    } catch (error: any) {
      console.error('Health check error:', error);
      return false;
    }
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || null;
  }
  
  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token') || null;
  }
  
  /**
   * Parse JWT token and extract expiration time
   */
  private getTokenExpiration(token: string): number | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      return payload.exp ? payload.exp : null;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  }
  
  /**
   * Check if token is about to expire
   */
  private isTokenExpiringSoon(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return false;
    
    // Check if token will expire within the threshold (default: 5 minutes)
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    return expiration - currentTime < API_CONFIG.tokenRefreshThreshold;
  }
  
  /**
   * Setup token refresh timer based on token expiration
   */
  private setupTokenRefreshTimer(tokens: TokenPair): void {
    // Clear any existing timer
    this.clearTokenRefreshTimer();
    
    if (!tokens.accessToken?.token) return;
    
    const expiration = this.getTokenExpiration(tokens.accessToken.token);
    if (!expiration) return;
    
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeUntilRefresh = Math.max(0, expiration - currentTime - API_CONFIG.tokenRefreshThreshold);
    
    console.log(`Setting up token refresh in ${timeUntilRefresh} seconds`);
    
    // Set timer to refresh token before it expires
    this.tokenRefreshTimer = setTimeout(() => {
      console.log('Token refresh timer triggered');
      this.performTokenRefresh().catch(error => {
        console.error('Scheduled token refresh failed:', error);
      });
    }, timeUntilRefresh * 1000); // Convert to milliseconds
  }
  
  /**
   * Clear the token refresh timer
   * This method is public to allow external cleanup from AuthContext
   */
  public clearTokenRefreshTimer(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }
  
  /**
   * Perform token refresh with retry logic
   */
  private async performTokenRefresh(providedToken?: string): Promise<TokenPair | null> {
    const refreshToken = providedToken || this.getRefreshToken();
    
    if (!refreshToken) {
      console.error('No refresh token available for refresh');
      this.handleTokenExpiration();
      return null;
    }
    
    // If there's already a refresh in progress, return that promise
    if (this.refreshTokenPromise) {
      console.log('Token refresh already in progress, waiting...');
      try {
        return await this.refreshTokenPromise.then(response => {
          return response.success && response.data ? response.data : null;
        });
      } catch (error) {
        console.error('Existing token refresh promise failed:', error);
        return null;
      }
    }
    
    console.log('Starting new token refresh process');
    
    // Create a new refresh token promise
    this.refreshTokenPromise = new Promise<ApiResponse<TokenPair>>(async (resolve, reject) => {
      try {
        // Reset retry counter
        this.refreshRetryCount = 0;
        
        // Attempt to refresh with retries
        const response = await this.attemptTokenRefresh(refreshToken);
        resolve(response);
      } catch (error) {
        console.error('Token refresh process failed:', error);
        reject(error);
      } finally {
        // Clear the promise reference
        this.refreshTokenPromise = null;
      }
    });
    
    // Wait for the promise to resolve
    const response = await this.refreshTokenPromise;
    
    if (response.success && response.data) {
      // Store new tokens
      const isRememberMe = localStorage.getItem('auth_token') !== null;
      this.storeTokens(response.data, isRememberMe);
      return response.data;
    }
    
    return null;
  }
  
  /**
   * Attempt token refresh with retry logic
   */
  private async attemptTokenRefresh(refreshToken: string): Promise<ApiResponse<TokenPair>> {
    try {
      const response = await this.api.post<ApiResponse<TokenPair>>('/v1/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      // Retry on server errors or network issues
      if (this.shouldRetry(error) && this.refreshRetryCount < this.maxRefreshRetries) {
        this.refreshRetryCount++;
        const delay = API_CONFIG.tokenRefreshRetryDelay;
        
        console.log(`Retrying token refresh (${this.refreshRetryCount}/${this.maxRefreshRetries}) after ${delay}ms`);
        
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              const retryResponse = await this.attemptTokenRefresh(refreshToken);
              resolve(retryResponse);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
        });
      }
      
      // Convert to standardized error
      const authError = this.handleApiError(error, 'Failed to refresh authentication token');
      
      // Return failed response
      return {
        success: false,
        error: authError.message,
        code: authError.code
      };
    }
  }

  /**
   * Store authentication tokens
   */
  private storeTokens(tokens: TokenPair, rememberMe: boolean): void {
    if (typeof window === 'undefined') return;
    
    const storage = rememberMe ? localStorage : sessionStorage;
    
    if (tokens.accessToken) {
      storage.setItem('auth_token', tokens.accessToken.token);
    }
    
    if (tokens.refreshToken) {
      storage.setItem('refresh_token', tokens.refreshToken.token);
    }
    
    // Remember user preference
    localStorage.setItem('remember_me', rememberMe.toString());
    
    // Setup automatic token refresh
    this.setupTokenRefreshTimer(tokens);
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    // Clear tokens
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    
    // Clear user data
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    
    // Clear token refresh timer
    this.clearTokenRefreshTimer();
  }
  /**
   * Handle token expiration by clearing auth data and redirecting to login
   */
  public handleTokenExpiration(): void {
    console.log('Token expired or invalid, redirecting to login');
    
    // Clear authentication data
    this.clearAuthData();
    
    // Dispatch a custom event that the AuthContext can listen for
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('auth:tokenExpired', {
        detail: { reason: 'Token expired or invalid' }
      });
      window.dispatchEvent(event);
      
      // Store the current path to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login' && !currentPath.includes('/register') && !currentPath.includes('/verify-email')) {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // Redirect to login after a short delay to allow event listeners to process
      setTimeout(() => {
        window.location.href = '/login?expired=true';
      }, 100);
    }
  }

  /**
   * Update local user cache
   */
  private updateLocalUserCache(user?: User): void {
    if (typeof window === 'undefined') return;
    
    if (user) {
      localStorage.setItem('user_cache', JSON.stringify(user));
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('emailVerified', user.isEmailVerified.toString());
    } else {
      localStorage.removeItem('user_cache');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('emailVerified');
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  /**
   * Create standardized AuthError
   */
  private createAuthError(error: any, retryAfterSeconds?: number): AuthError {
    if (error.code === 'ECONNABORTED') {
      return {
        statusCode: 408,
        message: 'Request timeout. Please try again.',
        code: 'TIMEOUT_ERROR'
      };
    }
    
    if (!error.response) {
      return {
        statusCode: 0,
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    }
    
    const response = error.response?.data;
    
    // Handle API error response format
    return {
      statusCode: error.response?.status || 500,
      message: response?.error || response?.message || error.message || 'An error occurred',
      field: response?.errors?.[0]?.field,
      code: response?.code || 'API_ERROR',
      retryAfter: retryAfterSeconds
    };
  }

  /**
   * Handle API errors with consistent error format
   */
  private handleApiError(error: any, defaultMessage: string): AuthError {
    // If it's already an AuthError, return it
    if (error.statusCode && error.message) {
      return error as AuthError;
    }
    
    // Handle client-side validation errors
    if (error instanceof Error && error.message) {
      return {
        statusCode: 400,
        message: error.message,
        code: 'VALIDATION_ERROR'
      };
    }

    // Handle API error response format
    const response = error.response?.data;
    return {
      statusCode: error.response?.status || 500,
      message: response?.error || response?.message || defaultMessage,
      field: response?.errors?.[0]?.field,
      code: response?.code || 'API_ERROR'
    };
  }

  /**
   * Validate registration data on client side
   */
  private validateRegistrationData(data: RegisterRequest): void {
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new Error('All required fields must be provided');
    }

    // Password validation
    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Check for uppercase, lowercase and number
    const hasUppercase = /[A-Z]/.test(data.password);
    const hasLowercase = /[a-z]/.test(data.password);
    const hasNumber = /[0-9]/.test(data.password);
    
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Please provide a valid email address');
    }
    
    // Name validation
    if (data.firstName.length < 2 || data.firstName.length > 50) {
      throw new Error('First name must be between 2 and 50 characters');
    }
    
    if (data.lastName.length < 2 || data.lastName.length > 50) {
      throw new Error('Last name must be between 2 and 50 characters');
    }
  }

  /**
   * Validate profile update data
   */
  private validateProfileUpdateData(data: UpdateProfileRequest): void {
    if (data.firstName && (data.firstName.length < 2 || data.firstName.length > 50)) {
      throw new Error('First name must be between 2 and 50 characters');
    }

    if (data.lastName && (data.lastName.length < 2 || data.lastName.length > 50)) {
      throw new Error('Last name must be between 2 and 50 characters');
    }
  }
}

// Export auth service instance
export const authService = new AuthService();

// Expose auth service for testing purposes
if (typeof window !== 'undefined') {
  window._getAuthService = () => authService;
}

// Export default instance
export default authService;

// Future enhancements:
// - Add offline support with service worker
// - Add request caching for repeated calls
// - Add request cancellation for component unmounting
// - Add progress tracking for file uploads
// - Add WebSocket connection for real-time updates
// - Add API mocking for development/testing
// - Add performance monitoring and metrics
