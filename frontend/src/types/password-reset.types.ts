// Password Reset API Request/Response Types

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  data: {
    message: string;
    resetId: string;
    expiresAt: string;
  };
}

export interface PasswordResetVerifyParams {
  token: string;
  email: string;
}

export interface PasswordResetVerifyResponse {
  success: boolean;
  data: {
    valid: boolean;
    email: string;
    expiresAt: string;
    expiresIn: number;
  };
}

export interface PasswordResetConfirmRequest {
  token: string;
  email: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetConfirmResponse {
  success: boolean;
  data: {
    message: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface PasswordResetStatusRequest {
  email?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PasswordResetStatusResponse {
  success: boolean;
  data: PasswordResetLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PasswordResetLogEntry {
  id: string;
  userId: string;
  email: string;
  action: 'REQUEST' | 'ATTEMPT' | 'SUCCESS' | 'FAILURE' | 'EXPIRED';
  ip: string;
  userAgent: string;
  requestedAt: string;
  completedAt?: string;
}

// Error Response Types
export interface ApiError {
  success: false;
  error: string;
  code: string;
  retryAfter?: number;
}

export type PasswordResetErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACCOUNT_LOCKED'
  | 'MISSING_PARAMETERS'
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_ALREADY_USED'
  | 'PASSWORD_POLICY_VIOLATION'
  | 'PASSWORD_MISMATCH'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN';

// Password Policy and Strength Types
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars?: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  meetsPolicy: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    specialChars?: boolean;
  };
}

// Form State Types
export interface PasswordResetRequestForm {
  email: string;
  errors: {
    email?: string;
  };
  loading: boolean;
  success: boolean;
  errorMessage?: string;
}

export interface PasswordResetForm {
  newPassword: string;
  confirmPassword: string;
  errors: {
    newPassword?: string;
    confirmPassword?: string;
    token?: string;
  };
  loading: boolean;
  success: boolean;
  errorMessage?: string;
  passwordStrength?: PasswordStrength;
}

// Component Props Types
export interface PasswordResetRequestProps {
  onSuccess?: (data: PasswordResetResponse['data']) => void;
  onError?: (error: ApiError) => void;
  className?: string;
}

export interface PasswordResetFormProps {
  token: string;
  email: string;
  onSuccess?: (data: PasswordResetConfirmResponse['data']) => void;
  onError?: (error: ApiError) => void;
  className?: string;
}

export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
  onStrengthChange?: (strength: PasswordStrength) => void;
}

// Hook Return Types
export interface UsePasswordResetRequest {
  requestReset: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  canRetry: boolean;
  retryAfter?: number;
}

export interface UsePasswordResetToken {
  token: string;
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number;
  error: string | null;
  loading: boolean;
}

export interface UsePasswordStrength {
  strength: PasswordStrength;
  calculateStrength: (password: string) => void;
}

export interface UsePasswordResetForm {
  formData: {
    newPassword: string;
    confirmPassword: string;
  };
  errors: {
    newPassword?: string;
    confirmPassword?: string;
  };
  handleChange: (field: string, value: string) => void;
  handleSubmit: (token: string, email: string) => Promise<void>;
  isValid: boolean;
  loading: boolean;
  success: boolean;
  errorMessage?: string;
}
