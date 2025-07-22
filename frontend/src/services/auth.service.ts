import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  RegisterRequest, 
  VerifyEmailRequest, 
  ResendVerificationRequest, 
  UpdateProfileRequest,
  User, 
  ApiResponse, 
  AuthError,
  ApiConfig 
} from '../types/auth.types';

// API configuration
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000, // 10 seconds
  retryAttempts: 3,
  version: 'v1'
};

export class AuthService {
  private api: AxiosInstance;
  private retryCount = 0;

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
        // TODO: Add authentication token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // TODO: Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // TODO: Add timestamp
        config.headers['X-Request-Timestamp'] = new Date().toISOString();

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
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error) => {
        console.error('API Error:', error.response?.data || error.message);
        
        // TODO: Handle token expiration (401)
        if (error.response?.status === 401) {
          this.handleTokenExpiration();
          return Promise.reject(this.createAuthError(error));
        }

        // TODO: Implement retry logic for network errors
        if (this.shouldRetry(error) && this.retryCount < API_CONFIG.retryAttempts) {
          this.retryCount++;
          console.log(`Retrying request (${this.retryCount}/${API_CONFIG.retryAttempts})`);
          return this.api.request(error.config);
        }

        this.retryCount = 0;
        return Promise.reject(this.createAuthError(error));
      }
    );
  }

  /**
   * Register new user account
   */
  async registerUser(userData: RegisterRequest): Promise<ApiResponse<User>> {
    try {
      // TODO: Validate input data on client side
      this.validateRegistrationData(userData);

      const response = await this.api.post<ApiResponse<User>>('/auth/register', userData);
      
      // TODO: Log successful registration
      console.log('User registered successfully:', response.data.data?.email);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleApiError(error, 'Registration failed');
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

      const requestData: VerifyEmailRequest = { token };
      const response = await this.api.post<ApiResponse<User>>('/auth/verify-email', requestData);
      
      // TODO: Log successful verification
      console.log('Email verified successfully:', response.data.data?.email);
      
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw this.handleApiError(error, 'Email verification failed');
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
   * Get current user profile (authenticated)
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get<ApiResponse<User>>('/users/profile');
      
      // TODO: Update local user cache if needed
      this.updateLocalUserCache(response.data.data);
      
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw this.handleApiError(error, 'Failed to load user profile');
    }
  }

  /**
   * Update user profile (authenticated)
   */
  async updateUserProfile(userData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      // TODO: Validate profile update data
      this.validateProfileUpdateData(userData);

      const response = await this.api.put<ApiResponse<User>>('/users/profile', userData);
      
      // TODO: Update local user cache
      this.updateLocalUserCache(response.data.data);
      
      console.log('Profile updated successfully:', response.data.data?.email);
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw this.handleApiError(error, 'Failed to update profile');
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
    // TODO: Implement token retrieval from localStorage/sessionStorage/cookies
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    // TODO: Clear local auth state and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
      
      // TODO: Trigger auth context update
      // window.location.href = '/login';
    }
  }

  /**
   * Update local user cache
   */
  private updateLocalUserCache(user?: User): void {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user));
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
    const response = error.response?.data;
    return {
      statusCode: error.response?.status || 500,
      message: response?.message || error.message || 'An error occurred',
      field: response?.errors?.[0]?.field
    };
  }

  /**
   * Handle API errors with consistent error format
   */
  private handleApiError(error: any, defaultMessage: string): AuthError {
    if (error instanceof Error && error.message) {
      return {
        statusCode: 400,
        message: error.message
      };
    }

    const response = error.response?.data;
    return {
      statusCode: error.response?.status || 500,
      message: response?.message || defaultMessage,
      field: response?.errors?.[0]?.field
    };
  }

  /**
   * Validate registration data on client side
   */
  private validateRegistrationData(data: RegisterRequest): void {
    // TODO: Implement client-side validation
    if (!data.email || !data.password || !data.firstName || !data.lastName) {
      throw new Error('All required fields must be provided');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Please provide a valid email address');
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

    if (data.phoneNumber) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(data.phoneNumber)) {
        throw new Error('Please provide a valid phone number');
      }
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

// Export default instance
export default authService;

// TODO: Add offline support with service worker
// TODO: Add request caching for repeated calls
// TODO: Add request cancellation for component unmounting
// TODO: Add progress tracking for file uploads
// TODO: Add WebSocket connection for real-time updates
// TODO: Add comprehensive error categorization
// TODO: Add request/response logging for debugging
// TODO: Add API mocking for development/testing
// TODO: Add performance monitoring and metrics
// TODO: Add automatic retry with exponential backoff
