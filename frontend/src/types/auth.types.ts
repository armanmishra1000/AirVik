// User role enum matching backend
export enum UserRole {
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

// Permission types for role-based access control
export enum Permission {
  AUTHENTICATED = 'authenticated',
  VERIFIED = 'verified',
  BOOKING = 'booking',
  PROFILE = 'profile',
  ADMIN = 'admin'
}

// Token types for authentication system
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset'
}

// User interface matching backend MongoDB schema exactly
export interface User {
  id: string; // MongoDB _id converted to string
  email: string;
  firstName: string;
  lastName: string;
  phone?: string; // Matches backend field name
  dateOfBirth?: string; // ISO date string
  role: UserRole;
  isEmailVerified: boolean; // Replaces status enum
  isActive: boolean;
  lastLoginAt?: string; // ISO date string
  profileImage?: string;
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    language: string;
  };
  metadata: {
    registrationIP?: string;
    userAgent?: string;
    source?: string;
  };
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  fullName: string; // Virtual field from backend
}

// Registration request interface
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string; // Matches backend field name
  dateOfBirth?: string; // Optional ISO date string
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
  phone?: string; // Matches backend field name
  dateOfBirth?: string; // ISO date string
  preferences?: {
    newsletter?: boolean;
    notifications?: boolean;
    language?: string;
  };
}

// Generic API response interface - matches backend standardized format exactly
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  errors?: ApiError[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API error interface
export interface ApiError {
  field: string;
  message: string;
  code?: string;
}

// Authentication error interface
export interface AuthError {
  statusCode: number;
  message: string;
  field?: string;
  code?: string;
  retryAfter?: number; // For rate limiting errors
}

// Form validation result interface
export interface ValidationResult {
  isValid: boolean;
  message: string;
  errors?: ValidationError[];
}

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  hasPermission: (permission: Permission) => boolean;
}

// Rate limiting interface
export interface RateLimitInfo {
  remainingTime: number;
  maxRequestsPerHour: number;
  currentRequestCount: number;
}

// Email verification result interface
export interface VerificationResult {
  userId: string;
  email: string;
  isEmailVerified: boolean;
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
  field: keyof RegisterRequest | keyof UpdateProfileRequest | keyof LoginRequest | keyof PasswordResetRequest | keyof ChangePasswordRequest;
  message: string;
  code?: string;
};

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_ERROR'; payload: AuthError }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_ERROR'; payload: AuthError }
  | { type: 'VERIFY_EMAIL_START' }
  | { type: 'VERIFY_EMAIL_SUCCESS'; payload: User }
  | { type: 'VERIFY_EMAIL_ERROR'; payload: AuthError }
  | { type: 'UPDATE_PROFILE_START' }
  | { type: 'UPDATE_PROFILE_SUCCESS'; payload: User }
  | { type: 'UPDATE_PROFILE_ERROR'; payload: AuthError }
  | { type: 'PASSWORD_RESET_START' }
  | { type: 'PASSWORD_RESET_SUCCESS' }
  | { type: 'PASSWORD_RESET_ERROR'; payload: AuthError }
  | { type: 'CHANGE_PASSWORD_START' }
  | { type: 'CHANGE_PASSWORD_SUCCESS' }
  | { type: 'CHANGE_PASSWORD_ERROR'; payload: AuthError }
  | { type: 'REFRESH_TOKEN_START' }
  | { type: 'REFRESH_TOKEN_SUCCESS'; payload: User }
  | { type: 'REFRESH_TOKEN_ERROR'; payload: AuthError }
  | { type: 'REFRESH_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: AuthError }
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

// Token interfaces
export interface JwtToken {
  token: string;
  expiresAt: string; // ISO date string
}

export interface TokenPair {
  accessToken: JwtToken;
  refreshToken: JwtToken;
}

// Login request interface
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Login response interface
export interface LoginResponse {
  user: User;
  tokens: TokenPair;
}

// Password reset request interfaces
export interface RequestPasswordResetRequest {
  email: string;
}

export interface PasswordResetRequest {
  token: string;
  newPassword: string;
}

// Change password request interface
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Email verification token interface
export interface EmailVerificationToken {
  userId: string;
  token: string;
  type: TokenType.EMAIL_VERIFICATION;
  expiresAt: string; // ISO date string
  usedAt?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Refresh token interface
export interface RefreshToken {
  userId: string;
  token: string;
  expiresAt: string; // ISO date string
  isRevoked: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Account deletion request interface
export interface DeleteAccountRequest {
  password: string;
  reason?: string;
}

// Admin user management interfaces
export interface AdminUserUpdateRequest {
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

// User search params for admin
export interface UserSearchParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'email' | 'lastName';
  sortOrder?: 'asc' | 'desc';
}

// Audit log interface
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string; // ISO date string
}

// Two-factor authentication interfaces
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
}

// Form state interfaces for new forms
export interface LoginFormState extends FormState {
  data: LoginRequest;
  rememberMe: boolean;
}

export interface PasswordResetFormState extends FormState {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordFormState extends FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Route guard props with permission support
export interface RouteGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  fallbackPath?: string;
  showVerificationPrompt?: boolean;
}

// Verification prompt props
export interface VerificationPromptProps {
  title?: string;
  message?: string;
  featureDescription?: string;
  onResend?: () => void;
  onClose?: () => void;
  className?: string;
}
