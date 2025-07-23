// Enhanced authentication types for complete auth system
// This file extends the existing auth.types.ts with additional interfaces

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  profileImage?: string;
  preferences: UserPreferences;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  GUEST = 'guest',
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface UserPreferences {
  newsletter: boolean;
  notifications: boolean;
  language: string;
}

// Authentication API Request Types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: Partial<UserPreferences>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: Partial<UserPreferences>;
}

// Authentication API Response Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Validation Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Auth Context Types
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  clearError: () => void;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
}

// Component Props Types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireEmailVerification?: boolean;
  fallback?: React.ReactNode;
}

export interface FormComponentProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

// Admin Management Types
export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

// Error Types
export enum AuthErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL'
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string;
  details?: any;
}

// TODO: Add WebSocket types for real-time auth events
// TODO: Add biometric authentication types
// TODO: Add social login types (Google, Facebook, etc.)
// TODO: Add audit log types for security tracking
