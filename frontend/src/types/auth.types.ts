// User status enum matching backend
export enum UserStatus {
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended'
}

// User interface matching backend MongoDB schema
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  fullName?: string; // Virtual field from backend
}

// Registration request interface
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Email verification request interface
export interface VerifyEmailRequest {
  token: string;
}

// Resend verification email request interface
export interface ResendVerificationRequest {
  email: string;
}

// Profile update request interface
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

// Generic API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  timestamp: string;
  requestId?: string;
}

// API error interface
export interface ApiError {
  field: string;
  message: string;
}

// Authentication error interface
export interface AuthError {
  statusCode: number;
  message: string;
  field?: string;
  isNetworkError?: boolean;
  retryAfter?: number;
  originalError?: any;
  rateLimitInfo?: VerificationRateLimitInfo;
}

// Form validation result interface
export interface ValidationResult {
  isValid: boolean;
  message: string;
  errors?: string[];
}

// Password validation interface with detailed feedback
export interface PasswordValidation {
  isValid: boolean;
  score: number; // 0-4 (weak to strong)
  feedback: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar?: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
  message: string;
}

// Form state interfaces
export interface FormState {
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export interface RegistrationFormState extends FormState {
  data: RegisterRequest;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface VerificationFormState extends FormState {
  token: string;
  isVerified: boolean;
}

export interface ResendVerificationState extends FormState {
  email: string;
  canResend: boolean;
  resendCountdown: number;
  requestCount: number;
}

export interface ProfileFormState extends FormState {
  data: UpdateProfileRequest;
  isEditing: boolean;
}

// Authentication state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
}

// Authentication context interface
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  updateProfile: (userData: UpdateProfileRequest) => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
}

// Rate limiting interface
export interface RateLimitInfo {
  remainingTime: number;
  maxRequestsPerHour: number;
  currentRequestCount: number;
}

// Enhanced rate limit info for verification emails
export interface VerificationRateLimitInfo {
  attempts: number;
  maxAttempts: number;
  resetTime: string | Date;
}

// Response data for resend verification
export interface ResendVerificationResponse {
  cooldown?: number;
  rateLimitInfo?: VerificationRateLimitInfo;
  message?: string;
}

// Email verification result interface
export interface VerificationResult {
  userId: string;
  email: string;
  status: UserStatus;
  isSuccess: boolean;
  redirectUrl?: string;
}

// Component prop interfaces
export interface RegistrationFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

export interface VerificationComponentProps {
  token?: string;
  onVerified?: (user: User) => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

export interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

export interface ResendVerificationProps {
  email?: string;
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

// Utility types
export type FormFieldError = {
  field: keyof RegisterRequest | keyof UpdateProfileRequest;
  message: string;
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: string }
  | { type: 'VERIFY_EMAIL_SUCCESS'; payload: User }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: User }
  | { type: 'REFRESH_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: AuthError | null }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Route protection types
export type ProtectedRouteProps = {
  children: React.ReactNode;
  requireVerified?: boolean;
  fallbackPath?: string;
};

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Environment configuration type
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  version: string;
}

// TODO: Add types for two-factor authentication when implemented
// TODO: Add types for password reset functionality
// TODO: Add types for social login integration
// TODO: Add types for account deletion
// TODO: Add types for admin user management
// TODO: Add types for audit logging
// TODO: Add types for email preferences
// TODO: Add types for notification settings
