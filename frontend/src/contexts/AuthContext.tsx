'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  User, 
  AuthError, 
  AuthContextType, 
  AuthState, 
  AuthAction, 
  UserRole, 
  Permission,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  TokenPair,
  ChangePasswordRequest,
  RequestPasswordResetRequest,
  PasswordResetRequest,
  DeleteAccountRequest
} from '../types/auth.types';
import { authService } from '../services/auth.service';

// Storage keys for token management
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  REMEMBER_ME: 'remember_me',
  USER_EMAIL: 'user_email',
  EMAIL_VERIFIED: 'email_verified'
} as const;

// Import additional types
import type { AuthStatusType } from '../types/auth.types';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  status: 'idle' as AuthStatusType,
  isVerified: false,
  lastActivity: new Date().toISOString()
};

// Token management functions
const storeTokens = (tokens: TokenPair, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  const storage = rememberMe ? localStorage : sessionStorage;
  
  // Store tokens in the appropriate storage
  if (tokens.accessToken) {
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken.token);
  }
  
  if (tokens.refreshToken) {
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken.token);
  }
  
  // Remember user preference
  localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());
};

const getStoredTokens = (): TokenPair | null => {
  if (typeof window === 'undefined') return null;
  
  // Check both localStorage and sessionStorage for tokens
  const accessTokenStr = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || 
                      sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshTokenStr = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || 
                       sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  
  if (!accessTokenStr && !refreshTokenStr) return null;
  
  // Create JwtToken objects with the token strings
  // Note: We don't have expiration times from storage, so we use current time + 1 hour as a fallback
  const defaultExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
  
  return { 
    accessToken: { 
      token: accessTokenStr || '',
      expiresAt: defaultExpiry
    },
    refreshToken: {
      token: refreshTokenStr || '',
      expiresAt: defaultExpiry
    }
  };
};

const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear tokens from both storages to be safe
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

const storeUserData = (user: User | null): void => {
  if (typeof window === 'undefined' || !user) return;
  
  const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  const storage = rememberMe ? localStorage : sessionStorage;
  
  storage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
};

const getStoredUserData = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  // Check both storages for user data
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || 
                  sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
  
  if (!userData) return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch (error) {
    console.error('Failed to parse stored user data:', error);
    return null;
  }
};

const clearUserData = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.EMAIL_VERIFIED);
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        status: 'loading',
        lastActivity: new Date().toISOString(),
      };
    case 'AUTH_SUCCESS':
      // Store user data when authentication is successful
      if (action.payload) {
        storeUserData(action.payload);
      }
      
      // Check if email is verified
      const isEmailVerified = action.payload?.isEmailVerified || false;
      
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        status: isEmailVerified ? 'authenticated' : 'verification_required',
        isVerified: isEmailVerified,
        lastActivity: new Date().toISOString(),
      };
    case 'AUTH_ERROR':
      // Clear tokens on authentication error if it's a token-related error
      if (action.payload?.code === 'INVALID_TOKEN' || 
          action.payload?.code === 'TOKEN_EXPIRED') {
        clearTokens();
      }
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        status: 'error',
        isVerified: false,
        lastActivity: new Date().toISOString(),
      };
    case 'AUTH_LOGOUT':
      // Clear all auth data on logout
      clearTokens();
      clearUserData();
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        status: 'unauthenticated',
        isVerified: false,
        lastActivity: new Date().toISOString(),
      };
    case 'UPDATE_USER':
      // Update stored user data when user is updated
      if (action.payload) {
        storeUserData(action.payload);
      }
      return {
        ...state,
        user: action.payload,
        error: null,
      };
    case 'REFRESH_TOKEN_START':
      return {
        ...state,
        isLoading: true,
        status: 'loading',
        lastActivity: new Date().toISOString(),
      };
    case 'REFRESH_TOKEN_SUCCESS':
      // Store new tokens when refresh is successful
      // Note: action.payload is User, not tokens, based on AuthAction type
      const isVerified = action.payload?.isEmailVerified || false;
      
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        status: isVerified ? 'authenticated' : 'verification_required',
        isVerified: isVerified,
        lastActivity: new Date().toISOString(),
      };
    case 'REFRESH_TOKEN_ERROR':
      // Clear tokens on refresh error
      clearTokens();
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        status: 'error',
        isVerified: false,
        lastActivity: new Date().toISOString(),
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        status: action.payload ? 'loading' : state.status,
        lastActivity: new Date().toISOString(),
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Check if user has stored tokens
      const tokens = getStoredTokens();
      if (!tokens || !tokens.accessToken.token) {
        // No tokens found, user is not authenticated
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      // Try to get stored user data first for immediate UI update
      const storedUser = getStoredUserData();
      if (storedUser) {
        // Temporarily set the user from storage while we verify with the server
        dispatch({ type: 'AUTH_SUCCESS', payload: storedUser });
      }

      // Verify token and get fresh user profile from server
      const response = await authService.getUserProfile();
      
      if (response.success && response.data) {
        // Update with the latest user data from server
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        // Invalid token, clear it
        clearTokens();
        clearUserData();
        dispatch({ type: 'AUTH_ERROR', payload: null });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Check if it's a token expiration error
      const authError = error as AuthError;
      if (authError.statusCode === 401 || authError.code === 'TOKEN_EXPIRED') {
        // Try to refresh the token
        try {
          const tokens = getStoredTokens();
          if (tokens?.refreshToken?.token) {
            const refreshResponse = await authService.refreshToken(tokens.refreshToken.token);
            if (refreshResponse.success && refreshResponse.data) {
              // Store new tokens
              const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
              storeTokens(refreshResponse.data, rememberMe);
              
              // Retry getting user profile
              const userResponse = await authService.getUserProfile();
              if (userResponse.success && userResponse.data) {
                dispatch({ type: 'AUTH_SUCCESS', payload: userResponse.data });
                return;
              }
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // If we reach here, all attempts failed
      clearTokens();
      clearUserData();
      dispatch({ 
        type: 'AUTH_ERROR', 
        payload: {
          statusCode: 401,
          message: 'Session expired. Please login again.',
          code: 'SESSION_EXPIRED'
        } 
      });
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_data');
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Call the login endpoint
      const response = await authService.login({ email, password });
      
      if (!response.success || !response.data) {
        throw {
          statusCode: 401,
          message: response.error || 'Login failed',
          code: 'LOGIN_FAILED'
        } as AuthError;
      }
      
      const { user, tokens } = response.data;
      
      // Store tokens based on remember me preference
      if (tokens) {
        storeTokens(tokens, rememberMe);
      }
      
      // Store user data
      storeUserData(user);
      
      // Update auth state
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error) {
      console.error('Login error:', error);
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    }
  };

  // Register function
  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<void> => {
    try {
      dispatch({ type: 'REGISTER_START' });

      // Call the register endpoint
      const response = await authService.registerUser(userData);
      
      if (!response.success || !response.data) {
        throw {
          statusCode: 400,
          message: response.error || 'Registration failed',
          code: 'REGISTRATION_FAILED'
        } as AuthError;
      }
      
      const user = response.data;
      
      // Note: Registration doesn't return tokens, only user data
      // User needs to verify email before they can login
      
      // Update auth state - but not authenticated yet
      dispatch({ type: 'REGISTER_SUCCESS', payload: user });
    } catch (error) {
      console.error('Registration error:', error);
      const authError = error as AuthError;
      dispatch({ type: 'REGISTER_ERROR', payload: authError });
      throw authError;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API if available
      // await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Update user profile
  const updateProfile = async (userData: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.updateUserProfile(userData);
      
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_USER', payload: response.data });
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Verify email
  const verifyEmail = async (token: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.verifyEmail(token);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    }
  };

  // Resend verification email
  const resendVerification = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.resendVerificationEmail(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification email');
      }
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check if user has specific role/permission
  const hasPermission = (permission: Permission): boolean => {
    // If not authenticated, no permissions
    if (!state.user) return false;
    
    // Basic permissions that all authenticated users have
    if (permission === Permission.AUTHENTICATED) {
      return true;
    }
    
    // Verified email permission
    if (permission === Permission.VERIFIED) {
      return state.user.isEmailVerified === true;
    }
    
    // Profile access permission
    if (permission === Permission.PROFILE) {
      return true; // All authenticated users can access their profile
    }
    
    // Booking permission (requires verified email)
    if (permission === Permission.BOOKING) {
      return state.user.isEmailVerified === true;
    }
    
    // Admin permission
    if (permission === Permission.ADMIN) {
      return state.user.role === UserRole.ADMIN;
    }
    
    // Manager permission (requires manager or admin role)
    if (permission === Permission.PROFILE && state.user.role === UserRole.MANAGER) {
      return true;
    }
    
    // Default: no permission
    return false;
  };

  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    try {
      dispatch({ type: 'REFRESH_TOKEN_START' });
      
      // Get stored tokens
      const tokens = getStoredTokens();
      if (!tokens || !tokens.refreshToken.token) {
        dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: {
          statusCode: 401,
          message: 'No refresh token available',
          code: 'NO_REFRESH_TOKEN'
        } as AuthError});
        return false;
      }
      
      // Call refresh token endpoint
      const response = await authService.refreshToken(tokens.refreshToken.token);
      
      if (!response.success || !response.data) {
        // Clear tokens on refresh failure
        clearTokens();
        clearUserData();
        
        dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: {
          statusCode: 401,
          message: response.error || 'Failed to refresh token',
          code: 'REFRESH_FAILED'
        } as AuthError});
        return false;
      }
      
      // Store new tokens
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      storeTokens(response.data, rememberMe);
      
      // Get user profile with new token
      const userResponse = await authService.getUserProfile();
      
      if (userResponse.success && userResponse.data) {
        dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: userResponse.data });
        return true;
      } else {
        dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: {
          statusCode: 401,
          message: 'Failed to get user profile after token refresh',
          code: 'USER_PROFILE_FAILED'
        } as AuthError});
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      clearUserData();
      
      dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: error as AuthError });
      return false;
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.changePassword({
        currentPassword,
        newPassword
      });
      
      if (!response.success) {
        throw {
          statusCode: 400,
          message: response.error || 'Failed to change password',
          code: 'PASSWORD_CHANGE_FAILED'
        } as AuthError;
      }
      
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      console.error('Password change error:', error);
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Request password reset
  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.requestPasswordReset(email);
      
      if (!response.success) {
        throw {
          statusCode: 400,
          message: response.error || 'Failed to request password reset',
          code: 'PASSWORD_RESET_REQUEST_FAILED'
        } as AuthError;
      }
      
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      console.error('Password reset request error:', error);
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Reset password with token
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await authService.resetPassword({
        token,
        newPassword
      });
      
      if (!response.success) {
        throw {
          statusCode: 400,
          message: response.error || 'Failed to reset password',
          code: 'PASSWORD_RESET_FAILED'
        } as AuthError;
      }
      
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      console.error('Password reset error:', error);
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };
  
  // Context value
  const contextValue: AuthContextType = {
    // State
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    verifyEmail,
    resendVerification,
    changePassword,
    requestPasswordReset,
    resetPassword,
    refreshToken,
    clearError,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
