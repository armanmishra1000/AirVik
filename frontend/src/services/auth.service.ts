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
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
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
              const response = await this.api.post<ApiResponse<TokenPair>>('/auth/refresh', { refreshToken });
              
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
            // No refresh token or refresh failed, handle expiration
            this.handleTokenExpiration();
          }
        }

        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          // Handle rate limiting with retry-after header
          const retryAfter = error.response.headers['retry-after'];
          console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
          
          // Add retry-after information to error
          const authError = this.createAuthError(error);
          authError.retryAfter = parseInt(retryAfter, 10) || 60;
          return Promise.reject(authError);
        }

        // Add retry logic for network errors
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff
          console.log(`Retrying request (${this.retryCount}/${this.maxRetries}) after ${delay}ms`);
          
          return new Promise(resolve => {
            setTimeout(() => {
              if (error.config) {
                resolve(this.api.request(error.config));
              } else {
                resolve(Promise.reject(error));
              }
            }, delay);
          });
        }

        // Convert to standardized error format
        return Promise.reject(this.createAuthError(error));
      }
    );
  }

  /**
   * Register new user account
   */
  async registerUser(userData: RegisterRequest): Promise<ApiResponse<User>> {
    try {
      // Validate input data on client side
      this.validateRegistrationData(userData);

      const response = await this.api.post<ApiResponse<User>>('/auth/register', userData);
      
      console.log('User registered successfully:', response.data.data?.email);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleApiError(error, 'Registration failed');
    }
  }

  /**
   * Login user and get JWT tokens
   */
  async login(loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      if (!loginData.email || !loginData.password) {
        throw new Error('Email and password are required');
      }

      const response = await this.api.post<ApiResponse<LoginResponse>>('/auth/login', loginData);
      
      // Store tokens based on rememberMe preference
      if (response.data.data?.tokens) {
        this.storeTokens(response.data.data.tokens, !!loginData.rememberMe);
        this.updateLocalUserCache(response.data.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleApiError(error, 'Login failed');
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.post<ApiResponse<void>>('/auth/logout');
      
      // Clear local storage regardless of API response
      this.clearAuthData();
      
      return response.data;
    } catch (error) {
      // Still clear local storage even if API call fails
      this.clearAuthData();
      console.error('Logout error:', error);
      throw this.handleApiError(error, 'Logout failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<TokenPair>> {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      const response = await this.api.post<ApiResponse<TokenPair>>('/auth/refresh', { refreshToken });
      
      // Update stored tokens
      if (response.data.data) {
        const isRememberMe = localStorage.getItem('auth_token') !== null;
        this.storeTokens(response.data.data, isRememberMe);
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw this.handleApiError(error, 'Failed to refresh token');
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

      const response = await this.api.post<ApiResponse<User>>('/auth/verify-email', { token });
      
      // Update local user cache if successful
      if (response.data.success && response.data.data) {
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw this.handleApiError(error, 'Email verification failed');
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
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please provide a valid email address');
      }

      const response = await this.api.post<ApiResponse<void>>('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Password reset request error:', error);
      throw this.handleApiError(error, 'Failed to request password reset');
    }
  }
  
  /**
   * Reset password with token
   */
  async resetPassword(resetData: PasswordResetRequest): Promise<ApiResponse<void>> {
    try {
      const { token, newPassword } = resetData;
      
      if (!token || !newPassword) {
        throw new Error('Token and new password are required');
      }
      
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await this.api.post<ApiResponse<void>>('/auth/reset-password', resetData);
      return response.data;
    } catch (error) {
      console.error('Password reset error:', error);
      throw this.handleApiError(error, 'Failed to reset password');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<ApiResponse<void>> {
    try {
      if (!email) {
        throw new Error('Email address is required');
      }

      const requestData: ResendVerificationRequest = { email };
      const response = await this.api.post<ApiResponse<void>>('/auth/resend-verification', requestData);
      
      // TODO: Log resend request
      console.log('Verification email resent to:', email);
      
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw this.handleApiError(error, 'Failed to resend verification email');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/users/profile');
      
      // Update local user cache
      if (response.data.success && response.data.data) {
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw this.handleApiError(error, 'Failed to get user profile');
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
        throw new Error('New password must be at least 8 characters long');
      }
      
      const response = await this.api.put<ApiResponse<void>>('/users/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw this.handleApiError(error, 'Failed to change password');
    }
  }
  
  /**
   * Delete user account
   */
  async deleteAccount(data: DeleteAccountRequest): Promise<ApiResponse<void>> {
    try {
      if (!data.password) {
        throw new Error('Password is required to delete account');
      }
      
      const response = await this.api.delete<ApiResponse<void>>('/users/account', { 
        data: { password: data.password } 
      });
      
      // Clear auth data on successful account deletion
      if (response.data.success) {
        this.clearAuthData();
      }
      
      return response.data;
    } catch (error) {
      console.error('Delete account error:', error);
      throw this.handleApiError(error, 'Failed to delete account');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      // Validate input data
      this.validateProfileUpdateData(userData);

      const response = await this.api.put<ApiResponse<User>>('/users/profile', userData);
      
      // Update local user cache
      if (response.data.success && response.data.data) {
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw this.handleApiError(error, 'Failed to update profile');
    }
  }
  
  /**
   * Get all users (admin only)
   */
  async getAllUsers(params?: UserSearchParams): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.api.get<ApiResponse<User[]>>('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Get all users error:', error);
      throw this.handleApiError(error, 'Failed to get users list');
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

      const response = await this.api.put<ApiResponse<User>>(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error('Update user role error:', error);
      throw this.handleApiError(error, 'Failed to update user role');
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

      const response = await this.api.put<ApiResponse<User>>(`/users/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Update user status error:', error);
      throw this.handleApiError(error, 'Failed to update user status');
    }
  }

  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/auth/health');
      return response.data.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }
  
  /**
   * Store authentication tokens
   */
  private storeTokens(tokens: TokenPair, rememberMe: boolean): void {
    if (typeof window === 'undefined') return;
    
    const { accessToken, refreshToken } = tokens;
    
    // Store access token in appropriate storage based on rememberMe
    if (rememberMe) {
      localStorage.setItem('auth_token', accessToken.token);
      localStorage.setItem('refresh_token', refreshToken.token);
    } else {
      sessionStorage.setItem('auth_token', accessToken.token);
      sessionStorage.setItem('refresh_token', refreshToken.token);
    }
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
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    if (typeof window !== 'undefined') {
      // Clear all auth data
      this.clearAuthData();
      
      // Dispatch event for auth context to handle
      const expiredEvent = new CustomEvent('auth:token_expired');
      window.dispatchEvent(expiredEvent);
      
      // Don't force redirect here, let the auth context handle it
    }
  }

  /**
   * Update local user cache
   */
  private updateLocalUserCache(user?: User): void {
    if (user && typeof window !== 'undefined') {
      // Store in the same storage as the token (localStorage or sessionStorage)
      if (localStorage.getItem('auth_token')) {
        localStorage.setItem('user_data', JSON.stringify(user));
      } else if (sessionStorage.getItem('auth_token')) {
        sessionStorage.setItem('user_data', JSON.stringify(user));
      }
      
      // Dispatch event for auth context to handle
      const userUpdatedEvent = new CustomEvent('auth:user_updated', { detail: user });
      window.dispatchEvent(userUpdatedEvent);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    return !error.response || (error.response.status >= 500);
  }

  /**
   * Create standardized AuthError
   */
  private createAuthError(error: any): AuthError {
    // Handle network errors (no response)
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
      code: response?.code,
      retryAfter: error.retryAfter
    };
  }

  /**
   * Throw validation error with field information
   */
  private throwValidationError(field: string, message: string): never {
    const error = new Error(message);
    (error as any).field = field;
    throw error;
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
    // TODO: Implement client-side validation for profile updates
    if (data.firstName && (data.firstName.length < 2 || data.firstName.length > 50)) {
      throw new Error('First name must be between 2 and 50 characters');
    }

    if (data.lastName && (data.lastName.length < 2 || data.lastName.length > 50)) {
      throw new Error('Last name must be between 2 and 50 characters');
    }

    if (data.phone) {
      const phoneRegex = /^[\+]?[0-9]{7,15}$/;
      if (!phoneRegex.test(data.phone)) {
        throw new Error('Please provide a valid phone number (7-15 digits with optional country code)');
      }
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
