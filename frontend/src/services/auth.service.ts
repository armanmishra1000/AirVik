import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
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
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  version: 'v1'
};

export class AuthService {
  private api: AxiosInstance;
  private retryCount = 0;
  private maxRetries = API_CONFIG.retryAttempts;

  constructor() {
    this.api = this.createApiInstance();
    this.setupInterceptors();
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
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Add timestamp
        config.headers['X-Request-Timestamp'] = new Date().toISOString();

        // Add API version
        config.headers['X-API-Version'] = API_CONFIG.version;

        // Add client info
        config.headers['X-Client-Type'] = 'web';

        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
        if (response.data && response.data.data && response.data.data.user) {
          // Update local user cache if user data is returned
          this.updateLocalUserCache(response.data.data.user);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Handle token expiration (401)
        if (error.response?.status === 401) {
          const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
          
          // Try to refresh token if available and not already trying to refresh
          if (refreshToken && !error.config?.url?.includes('/auth/refresh')) {
            try {
              // Attempt to refresh the token
              const response = await this.api.post<ApiResponse<TokenPair>>('/v1/auth/refresh', { refreshToken });
              
              if (response.data.success && response.data.data) {
                // Store new tokens
                const isRememberMe = localStorage.getItem('auth_token') !== null;
                this.storeTokens(response.data.data, isRememberMe);
                
                // Retry the original request with new token
                const originalRequest = error.config;
                if (originalRequest && originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken.token}`;
                  return this.api(originalRequest);
                }
              }
            } catch (refreshError) {
              // If refresh fails, clear auth and redirect to login
              console.error('Token refresh failed:', refreshError);
              this.handleTokenExpiration();
            }
          } else {
            // No refresh token or already trying to refresh, handle expiration
            this.handleTokenExpiration();
          }
        }
        
        // Handle rate limiting (429)
        let retryAfterSeconds: number | undefined;
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          if (retryAfter) {
            retryAfterSeconds = parseInt(retryAfter, 10);
          }
        }
        
        // Handle server errors with retry
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          
          console.log(`Retrying request (${this.retryCount}/${this.maxRetries}) after ${delay}ms`);
          
          return new Promise(resolve => {
            setTimeout(() => {
              if (error.config) {
                resolve(this.api(error.config));
              }
            }, delay);
          });
        }
        
        // Reset retry count for next request
        this.retryCount = 0;
        
        // Create standardized error object
        const authError = this.createAuthError(error, retryAfterSeconds);
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
      
      const response = await this.api.post<ApiResponse<User>>('/v1/auth/register', userData);
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
      const response = await this.api.post<ApiResponse<LoginResponse>>('/v1/auth/login', loginData);
      
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
      const response = await this.api.post<ApiResponse<void>>('/v1/auth/logout');
      
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
      const response = await this.api.post<ApiResponse<TokenPair>>('/v1/auth/refresh', {
        refreshToken
      });
      
      if (response.data.success && response.data.data) {
        // Update stored tokens
        const isRememberMe = localStorage.getItem('auth_token') !== null;
        this.storeTokens(response.data.data, isRememberMe);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear auth data and redirect to login
      this.handleTokenExpiration();
      const authError = this.handleApiError(error, 'Token refresh failed');
      throw authError;
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

      const response = await this.api.post<ApiResponse<User>>('/v1/auth/verify-email', {
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
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  /**
   * Store authentication tokens
   */
  private storeTokens(tokens: TokenPair, rememberMe: boolean): void {
    if (typeof window === 'undefined') return;
    
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Store access token
    storage.setItem('auth_token', tokens.accessToken.token);
    
    // Store refresh token
    if (rememberMe) {
      localStorage.setItem('refresh_token', tokens.refreshToken.token);
    } else {
      sessionStorage.setItem('refresh_token', tokens.refreshToken.token);
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window === 'undefined') return;
    
    // Clear tokens from both storages
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_cache');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('emailVerified');
    
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_cache');
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    this.clearAuthData();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
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

// Create singleton instance
export const authService = new AuthService();

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
