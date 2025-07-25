import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  RegisterRequest, 
  VerifyEmailRequest, 
  ResendVerificationRequest, 
  ResendVerificationResponse,
  UpdateProfileRequest,
  User, 
  ApiResponse, 
  AuthError,
  ApiConfig 
} from '../types/auth.types';

// API configuration based on environment
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', // Confirmed backend port is 5000
  timeout: 15000, // 15 seconds timeout
  retryAttempts: 3,
  version: 'v1'
};

// Different environment configurations
const ENV_CONFIGS = {
  development: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 15000,
    retryAttempts: 3
  },
  test: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    timeout: 5000,
    retryAttempts: 1
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.airvik.com',
    timeout: 10000,
    retryAttempts: 3
  }
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
    // Get environment-specific configuration
    const env = process.env.NODE_ENV || 'development';
    const config = ENV_CONFIGS[env as keyof typeof ENV_CONFIGS] || ENV_CONFIGS.development;
    
    return axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        'X-Client-Platform': 'web'
      },
      withCredentials: true // Enable sending cookies with requests
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

        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        // Request interceptor error - handled silently
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log(`API Response: ${response.status} ${response.config.url}`);
        }
        
        // Check if response has expected format
        if (!response.data.hasOwnProperty('success')) {
          // API response missing success property - handled silently
        }
        
        return response;
      },
      async (error: AxiosError) => {
        // Handle network errors (no response)
        if (!error.response) {
          return Promise.reject(this.createNetworkError(error));
        }
        
        // Handle API errors silently - UI will display user-friendly messages
        
        // Handle token expiration (401)
        if (error.response?.status === 401) {
          this.handleTokenExpiration();
          return Promise.reject(this.createAuthError(error));
        }
        
        // Handle rate limiting (429)
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          const seconds = parseInt(retryAfter, 10);
          
          console.warn(`Rate limited. Retry after ${seconds} seconds`);
          return Promise.reject(this.createRateLimitError(error, seconds));
        }

        // Implement retry logic for network errors and server errors (5xx)
        if (this.shouldRetry(error) && this.retryCount < API_CONFIG.retryAttempts) {
          this.retryCount++;
          
          // Exponential backoff
          const delay = Math.pow(2, this.retryCount) * 1000;
          
          console.log(`Retrying request (${this.retryCount}/${API_CONFIG.retryAttempts}) after ${delay}ms`);
          
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(this.api.request(error.config as AxiosRequestConfig));
            }, delay);
          });
        }

        this.retryCount = 0;
        return Promise.reject(this.handleApiError(error, 'An unexpected error occurred'));
      }
    );
  }

  /**
   * Register new user account
   */
  async registerUser(userData: RegisterRequest): Promise<ApiResponse<{user: User, token: string}>> {
    // Clean up empty phoneNumber field (convert empty string to undefined)
    if (userData.phoneNumber === '') {
      userData.phoneNumber = undefined;
    }
    try {
      // Debug: Log the request data with detailed structure
      console.log('Registration request data:', JSON.stringify(userData, null, 2));
      console.log('Registration request fields:', {
        email: typeof userData.email,
        password: typeof userData.password,
        firstName: typeof userData.firstName,
        lastName: typeof userData.lastName,
        phoneNumber: typeof userData.phoneNumber
      });
      
      // Validate data on client side
      this.validateRegistrationData(userData);
      
      // Log API endpoint and exact request payload
      // API Request: POST /v1/auth/register
      
      // Make API request
      const response = await this.api.post<ApiResponse<{user: User, token: string}>>(`/v1/auth/register`, userData);
      
      // Registration successful
      
      if (response.data.success && response.data.data) {
        // Store user data but not auth token since email verification is required
        if (response.data.data.user) {
          // If response has nested user object
          this.updateLocalUserCache(response.data.data.user);
        } else {
          // If response has user data directly
          this.updateLocalUserCache(response.data.data as unknown as User);
        }
      }
      
      return response.data;
    } catch (error) {
      // Handle registration errors silently for expected cases like duplicate email
      
      // Check for rate limiting errors
      if ((error as any).response?.status === 429) {
        const retryAfter = (error as any).response?.headers?.['retry-after'] || 60;
        // Rate limited - will be handled by UI
        
        // Return a structured error response for rate limiting
        return {
          success: false,
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          errors: [{ field: 'global', message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.` }],
          timestamp: new Date().toISOString(),
          data: null
        } as ApiResponse<any>;
      }
      
      // Error details are handled by the response interceptor and UI
      // Re-throw the error as-is since the response interceptor has already processed it
      throw error;
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
      const response = await this.api.post<ApiResponse<User>>('/v1/auth/verify-email', requestData);
      
      if (response.data.success && response.data.data) {
        // Update local user cache with verified user data
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Email verification failed');
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<ApiResponse<ResendVerificationResponse>> {
    try {
      if (!email) {
        throw new Error('Email address is required');
      }

      const requestData: ResendVerificationRequest = { email };
      const response = await this.api.post<ApiResponse<ResendVerificationResponse>>('/v1/auth/resend-verification', requestData);
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to resend verification email');
    }
  }

  /**
   * Get current user profile (authenticated)
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      // This endpoint requires authentication
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await this.api.get<ApiResponse<User>>('/v1/user/profile');
      
      if (response.data.success && response.data.data) {
        // Update local user cache with latest profile data
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to load user profile');
    }
  }

  /**
   * Update user profile (authenticated)
   */
  async updateUserProfile(userData: UpdateProfileRequest): Promise<ApiResponse<User>> {
    try {
      // Validate profile update data
      this.validateProfileUpdateData(userData);

      // This endpoint requires authentication
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await this.api.put<ApiResponse<User>>('/v1/user/profile', userData);
      
      if (response.data.success && response.data.data) {
        // Update local user cache with updated profile data
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to update profile');
    }
  }

  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Use the correct health endpoint path (without the /v1 prefix)
      const response = await this.api.get('/health');
      return response.data.status === 'ok';
    } catch (error) {
      // Health check failed - handled silently
      return false;
    }
  }
  
  /**
   * Login user
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<ApiResponse<{user: User, token: string}>> {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const response = await this.api.post<ApiResponse<{user: User, token: string}>>('/v1/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        // Store auth token
        this.storeAuthToken(response.data.data.token, rememberMe);
        
        // Store user data
        this.updateLocalUserCache(response.data.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Login failed');
    }
  }
  
  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint if token exists
      const token = this.getAuthToken();
      if (token) {
        await this.api.post('/v1/auth/logout');
      }
    } catch (error) {
      // Logout error - handled silently
    } finally {
      // Always clear local auth state regardless of API success
      this.clearAuthData();
    }
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      // First try localStorage for "remember me" functionality
      const token = localStorage.getItem('auth_token');
      if (token) return token;
      
      // Then try sessionStorage for session-only login
      return sessionStorage.getItem('auth_token');
    }
    return null;
  }
  
  /**
   * Store authentication token
   */
  private storeAuthToken(token: string, rememberMe: boolean = false): void {
    if (typeof window !== 'undefined') {
      if (rememberMe) {
        // Store in localStorage for persistent login
        localStorage.setItem('auth_token', token);
        // Remove from sessionStorage to avoid duplication
        sessionStorage.removeItem('auth_token');
      } else {
        // Store in sessionStorage for session-only login
        sessionStorage.setItem('auth_token', token);
        // Remove from localStorage to avoid duplication
        localStorage.removeItem('auth_token');
      }
    }
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    this.clearAuthData();
    
    // Dispatch custom event for auth context to handle
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('auth:token_expired');
      window.dispatchEvent(event);
    }
  }
  
  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      // Clear tokens
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // Clear user data
      localStorage.removeItem('user_data');
      sessionStorage.removeItem('user_data');
      
      // Dispatch custom event for auth context to handle
      const event = new CustomEvent('auth:logout');
      window.dispatchEvent(event);
    }
  }

  /**
   * Update local user cache
   */
  private updateLocalUserCache(user?: User): void {
    if (user && typeof window !== 'undefined') {
      const storage = this.getAuthToken() && localStorage.getItem('auth_token') 
        ? localStorage 
        : sessionStorage;
      
      storage.setItem('user_data', JSON.stringify(user));
      
      // Dispatch custom event for auth context to handle
      const event = new CustomEvent('auth:user_updated', { detail: user });
      window.dispatchEvent(event);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: any): boolean {
    // Only retry on network errors or server errors (5xx)
    if (!error.response) {
      return true; // Network error
    }
    
    const status = error.response.status;
    return status >= 500 && status < 600; // Server error
  }
  
  /**
   * Create network error object
   */
  private createNetworkError(error: any): AuthError {
    return {
      statusCode: 0,
      message: 'Network error. Please check your internet connection.',
      isNetworkError: true,
      originalError: error
    };
  }
  
  /**
   * Create rate limit error object
   */
  private createRateLimitError(error: any, retryAfter: number): AuthError {
    return {
      statusCode: 429,
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      originalError: error
    };
  }
  
  /**
   * Create auth error object
   */
  private createAuthError(error: any): AuthError {
    this.handleTokenExpiration();
    
    return {
      statusCode: 401,
      message: 'Authentication failed. Please log in again.',
      originalError: error
    };
  }

  /**
   * Handle API errors with consistent error format
   */
  private handleApiError(error: any, defaultMessage: string): AuthError {
    // Client-side validation errors
    if (error instanceof Error && !error.hasOwnProperty('response')) {
      return {
        statusCode: 400,
        message: error.message
      };
    }
    
    // No response (network error)
    if (!error.response) {
      return this.createNetworkError(error);
    }
    
    // API error response
    const response = error.response.data;
    const status = error.response.status;
    
    // Handle standardized API response format {success: false, message: string, errors: Array}
    if (response && typeof response === 'object') {
      // Handle validation errors with specific field errors
      if (status === 400 && response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
        const firstError = response.errors[0];
        return {
          statusCode: 400,
          message: firstError.message || response.message || 'Validation error',
          field: firstError.field
        };
      }
      
      // Handle rate limiting
      if (status === 429) {
        const retryAfter = error.response.headers['retry-after'] || '60';
        return this.createRateLimitError(error, parseInt(retryAfter, 10));
      }
      
      // Handle authentication errors
      if (status === 401) {
        return {
          statusCode: 401,
          message: response.message || 'Authentication required'
        };
      }
      
      // Handle not found errors
      if (status === 404) {
        return {
          statusCode: 404,
          message: response.message || 'Resource not found'
        };
      }
      
      // Handle other API errors with standardized format
      return {
        statusCode: status || 500,
        message: response.message || defaultMessage,
        field: response.field
      };
    }
    
    // Fallback for non-standardized responses
    return {
      statusCode: status || 500,
      message: defaultMessage
    };
  }

  /**
   * Helper method to throw validation errors as AuthError objects
   */
  private throwValidationError(message: string, field: string): never {
    const authError = {
      statusCode: 400,
      message,
      field
    };
    const errorInstance = new Error(message);
    Object.assign(errorInstance, authError);
    throw errorInstance;
  }

  /**
   * Validate registration data on client side
   */
  private validateRegistrationData(data: RegisterRequest): void {
    // Validation matching backend requirements exactly
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      this.throwValidationError('Please provide a valid email address', 'email');
    }

    // Password validation - must match backend regex exactly: at least 8 chars with uppercase, lowercase, and number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!data.password || !passwordRegex.test(data.password)) {
      this.throwValidationError('Password must be at least 8 characters with uppercase, lowercase, and number', 'password');
    }

    // First name validation
    if (!data.firstName || data.firstName.length < 2 || data.firstName.length > 50) {
      this.throwValidationError('First name must be 2-50 characters', 'firstName');
    }
    // Check first name contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(data.firstName)) {
      this.throwValidationError('First name must contain only letters and spaces', 'firstName');
    }

    // Last name validation
    if (!data.lastName || data.lastName.length < 2 || data.lastName.length > 50) {
      this.throwValidationError('Last name must be 2-50 characters', 'lastName');
    }
    // Check last name contains only letters and spaces
    if (!nameRegex.test(data.lastName)) {
      this.throwValidationError('Last name must contain only letters and spaces', 'lastName');
    }

    // Phone number validation (optional)
    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      // Remove all non-digit characters except + for validation
      const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, '');
      
      // Allow international format: +1234567890 or domestic: 1234567890 or 01234567890
      // Must be 7-15 digits (excluding country code +)
      const phoneRegex = /^[\+]?[0-9]{7,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        this.throwValidationError('Please provide a valid phone number (7-15 digits)', 'phoneNumber');
      }
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

    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      // Remove all non-digit characters except + for validation
      const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, '');
      
      // Allow international format: +1234567890 or domestic: 1234567890 or 01234567890
      // Must be 7-15 digits (excluding country code +)
      const phoneRegex = /^[\+]?[0-9]{7,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Please provide a valid phone number (7-15 digits)');
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
