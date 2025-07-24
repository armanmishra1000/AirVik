import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  RegisterRequest, 
  VerifyEmailRequest, 
  ResendVerificationRequest, 
  ResendVerificationResponse,
  UpdateProfileRequest,
  LoginRequest,
  LoginResponse,
  User, 
  ApiResponse, 
  AuthError,
  ApiConfig 
} from '../types/auth.types';

// API configuration based on environment
const API_CONFIG: ApiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', // Backend server URL
  timeout: 15000, // 15 seconds timeout
  retryAttempts: 3,
  version: 'v1'
};

// API endpoints mapping
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout', 
    REFRESH: '/api/v1/auth/refresh',
    VERIFY_TOKEN: '/api/v1/auth/verify-token',
    CURRENT_USER: '/api/v1/auth/me',
    REGISTER: '/api/v1/auth/register',
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    RESEND_VERIFICATION: '/api/v1/auth/resend-verification'
  },
  HEALTH: '/api/health'
};

// Different environment configurations
const ENV_CONFIGS = {
  development: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000',
    timeout: 15000,
    retryAttempts: 3
  },
  test: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000',
    timeout: 5000,
    retryAttempts: 1
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') || 'https://api.airvik.com',
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
    
    // Ensure baseURL doesn't end with /api to prevent duplicate /api in URLs
    let baseUrl = config.baseUrl;
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4); // Remove trailing /api
      console.warn('Removed /api from baseURL to prevent duplication:', baseUrl);
    }
    
    console.log('Creating axios instance with baseURL:', baseUrl);
    
    return axios.create({
      baseURL: baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        'X-Client-Platform': 'web'
      },
      withCredentials: true // Enable sending cookies with requests for authentication
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
        console.error('Request interceptor error:', error);
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
          console.warn('API response missing success property:', response.data);
        }
        
        return response;
      },
      async (error: AxiosError) => {
        // Handle network errors (no response)
        if (!error.response) {
          console.error('Network error:', error.message);
          return Promise.reject(this.createNetworkError(error));
        }
        
        // Log error details in development
        if (process.env.NODE_ENV === 'development') {
          console.error('API Error:', error.response?.data || error.message);
        }
        
        // Handle validation errors (400) - don't retry these
        if (error.response?.status === 400) {
          this.retryCount = 0;
          return Promise.reject(this.handleApiError(error, 'Validation failed'));
        }
        
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

  // =============================================================================
  // AUTHENTICATION API METHODS - CONNECTED TO REAL BACKEND
  // =============================================================================

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(email: string, password: string, rememberMe: boolean = false): Promise<ApiResponse<{user: User, token: string}>> {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      const response = await this.api.post<ApiResponse<{user: User, token: string}>>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      
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
   * POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint if token exists
      const token = this.getAuthToken();
      if (token) {
        await this.api.post(API_ENDPOINTS.AUTH.LOGOUT);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local cleanup even if backend call fails
    } finally {
      // Always clear local auth data
      this.clearAuthData();
    }
  }

  /**
   * Get current authenticated user
   * GET /api/v1/auth/me
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.CURRENT_USER);
      
      if (response.data.success && response.data.data) {
        // Update local user cache
        this.updateLocalUserCache(response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get current user');
    }
  }

  /**
   * Refresh authentication token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(): Promise<ApiResponse<{ accessToken: string; expiresIn: number }>> {
    try {
      const response = await this.api.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(API_ENDPOINTS.AUTH.REFRESH);
      
      if (response.data.success && response.data.data) {
        // Determine storage type based on current token location
        const rememberMe = !!localStorage.getItem('auth_token');
        this.storeAuthToken(response.data.data.accessToken, rememberMe);
      }
      
      return response.data;
    } catch (error) {
      // If refresh fails, clear auth data
      this.clearAuthData();
      throw this.handleApiError(error, 'Token refresh failed');
    }
  }

  /**
   * Verify authentication token
   * POST /api/v1/auth/verify-token
   */
  async verifyToken(): Promise<ApiResponse<{ valid: boolean; user?: User }>> {
    try {
      const response = await this.api.post<ApiResponse<{ valid: boolean; user?: User }>>(API_ENDPOINTS.AUTH.VERIFY_TOKEN);
      
      if (response.data.success && response.data.data?.valid && response.data.data.user) {
        // Update local user cache if token is valid
        this.updateLocalUserCache(response.data.data.user);
      } else if (response.data.success && !response.data.data?.valid) {
        // Clear auth data if token is invalid
        this.clearAuthData();
      }
      
      return response.data;
    } catch (error) {
      // If verification fails, clear auth data
      this.clearAuthData();
      throw this.handleApiError(error, 'Token verification failed');
    }
  }

  /**
   * Register new user account
   * POST /api/v1/auth/register
   */
  async registerUser(userData: RegisterRequest): Promise<ApiResponse<{user: User, token: string}>> {
    try {
      // Validate data on client side
      this.validateRegistrationData(userData);
      
      const response = await this.api.post<ApiResponse<{user: User, token: string}>>(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      if (response.data.success && response.data.data) {
        // Store user data but not auth token since email verification is required
        if (response.data.data.user) {
          this.updateLocalUserCache(response.data.data.user);
        }
      }
      
      return response.data;
    } catch (error) {
      // Error has already been processed by response interceptor
      // Just re-throw it without additional processing
      console.log('registerUser caught error:', error);
      throw error;
    }
  }

  /**
   * Verify email address
   * POST /api/v1/auth/verify-email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<{user: User, token: string}>> {
    try {
      const response = await this.api.post<ApiResponse<{user: User, token: string}>>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data);
      
      if (response.data.success && response.data.data) {
        // Store auth token after successful verification
        this.storeAuthToken(response.data.data.token, false);
        
        // Update user data
        this.updateLocalUserCache(response.data.data.user);
      }
      
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Email verification failed');
    }
  }

  /**
   * Resend verification email
   * POST /api/v1/auth/resend-verification
   */
  async resendVerificationEmail(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    try {
      const response = await this.api.post<ResendVerificationResponse>(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to resend verification email');
    }
  }

  /**
   * Test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get(API_ENDPOINTS.HEALTH);
      return response.data.status === 'ok';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    // Check localStorage first (remember me)
    let token = localStorage.getItem('auth_token');
    
    // Check sessionStorage if not in localStorage
    if (!token) {
      token = sessionStorage.getItem('auth_token');
    }
    
    return token;
  }

  /**
   * Store authentication token
   */
  private storeAuthToken(token: string, rememberMe: boolean): void {
    if (rememberMe) {
      localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user_data');
  }

  /**
   * Update local user cache
   */
  private updateLocalUserCache(user: User): void {
    const userData = JSON.stringify(user);
    
    // Store in the same location as the token
    if (localStorage.getItem('auth_token')) {
      localStorage.setItem('user_data', userData);
    } else {
      sessionStorage.setItem('user_data', userData);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpiration(): void {
    this.clearAuthData();
    // Optionally redirect to login page or emit event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:token-expired'));
    }
  }

  /**
   * Create network error
   */
  private createNetworkError(error: AxiosError): AuthError {
    console.log('createNetworkError called with:', { error, errorMessage: error.message, hasResponse: !!error.response });
    const networkError = {
      statusCode: 0,
      message: 'Network error. Please check your connection and try again.',
      originalError: error
    };
    console.log('Returning network error:', networkError);
    return networkError;
  }

  /**
   * Create authentication error
   */
  private createAuthError(error: AxiosError): AuthError {
    return {
      statusCode: 401,
      message: 'Authentication failed. Please login again.',
      originalError: error
    };
  }

  /**
   * Create rate limit error
   */
  private createRateLimitError(error: AxiosError, retryAfter: number): AuthError {
    return {
      statusCode: 429,
      message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      originalError: error
    };
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  /**
   * Handle API errors with proper formatting
   */
  private handleApiError(error: any, defaultMessage: string): AuthError {
    console.log('handleApiError called with:', { error, hasResponse: !!error.response, hasOriginalError: !!error.originalError });
    
    // Handle nested error objects (check if error has an originalError)
    let actualError = error;
    if (error.originalError && error.originalError.response) {
      actualError = error.originalError;
      console.log('Using originalError:', { actualError });
    }
    
    // Network error (no response)
    if (!actualError.response) {
      console.log('No response found, creating network error');
      return this.createNetworkError(actualError);
    }
    
    // API error response
    const response = actualError.response.data;
    const status = actualError.response.status;
    
    console.log('Processing API error:', { status, response, errorType: 'API_ERROR' });
    
    // Handle standardized API response format {success: false, message: string, errors: Array}
    if (response && typeof response === 'object') {
      // Handle validation errors with specific field errors
      if (status === 400 && response.errors && Array.isArray(response.errors) && response.errors.length > 0) {
        const firstError = response.errors[0];
        const validationError = {
          statusCode: 400,
          message: firstError.message || response.message || 'Validation error',
          field: firstError.field || firstError.path || 'unknown'
        };
        console.log('Returning validation error:', validationError);
        return validationError;
      }
      
      // Handle rate limiting
      if (status === 429) {
        const retryAfter = actualError.response.headers['retry-after'] || '60';
        return this.createRateLimitError(actualError, parseInt(retryAfter, 10));
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
   * Validate registration data on client side
   */
  private validateRegistrationData(data: RegisterRequest): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      throw new Error('Please provide a valid email address');
    }

    // Password validation - must match backend regex exactly
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!data.password || !passwordRegex.test(data.password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, and number');
    }

    // First name validation
    if (!data.firstName || data.firstName.length < 2 || data.firstName.length > 50) {
      throw new Error('First name must be 2-50 characters');
    }

    // Last name validation
    if (!data.lastName || data.lastName.length < 2 || data.lastName.length > 50) {
      throw new Error('Last name must be 2-50 characters');
    }

    // Phone number validation (optional)
    if (data.phoneNumber && data.phoneNumber.trim() !== '') {
      const cleanPhone = data.phoneNumber.replace(/[^\d+]/g, '');
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
