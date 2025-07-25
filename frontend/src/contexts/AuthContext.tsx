'use client';

// Extend Window interface for testing helpers
declare global {
  interface Window {
    _getAuthContext: () => any;
    _getAuthService: () => any;
  }
}

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  lastActivity: new Date().toISOString(),
  tokenRefreshInProgress: false
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
  
  // Clear token refresh timer using authService
  authService.clearTokenRefreshTimer();
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
    case 'TOKEN_REFRESH_START':
      return {
        ...state,
        tokenRefreshInProgress: true
      };
      
    case 'TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        tokenRefreshInProgress: false,
        error: null
      };
      
    case 'TOKEN_REFRESH_ERROR':
      return {
        ...state,
        tokenRefreshInProgress: false,
        error: action.payload
      };
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
      
      // Format error to ensure it's a properly formatted error object with string message
      let formattedError = action.payload;
      if (typeof formattedError === 'object' && formattedError !== null) {
        formattedError = {
          ...formattedError,
          message: typeof formattedError.message === 'string' ? formattedError.message : 'An error occurred'
        };
      } else if (formattedError === null || formattedError === undefined) {
        formattedError = { message: 'An unknown error occurred', code: 'UNKNOWN_ERROR', statusCode: 500 };
      }
      
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: formattedError,
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
      
      // Format error to ensure it's a properly formatted error object with string message
      let formattedRefreshError = action.payload;
      if (typeof formattedRefreshError === 'object' && formattedRefreshError !== null) {
        formattedRefreshError = {
          ...formattedRefreshError,
          message: typeof formattedRefreshError.message === 'string' ? formattedRefreshError.message : 'Token refresh failed'
        };
      } else if (formattedRefreshError === null || formattedRefreshError === undefined) {
        formattedRefreshError = { message: 'Token refresh failed', code: 'REFRESH_ERROR', statusCode: 401 };
      }
      
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: formattedRefreshError,
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // For testing purposes only
  const contextRef = useRef<AuthContextType | null>(null);

  // Reference to track if component is mounted
  const isMounted = useRef(true);
  // Reference to track token refresh timer
  const tokenRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initializeAuth = async () => {
    // Skip if not in browser environment
    if (typeof window === 'undefined') {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    try {
      dispatch({ type: 'AUTH_START' });

      // Check if user has stored tokens
      const tokens = getStoredTokens();
      if (!tokens || !tokens.accessToken.token) {
        // No tokens found, user is not authenticated
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      // Check for stored tokens
      const storedTokens = getStoredTokens();
      const storedUser = getStoredUserData();
      
      // Setup token refresh timer if tokens exist
      if (storedTokens?.accessToken?.token) {
        setupTokenRefreshTimer(storedTokens);
      }
      
      if (!storedTokens || !storedUser) {
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
          const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || 
                             sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          
          if (!refreshToken) {
            dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: {
              statusCode: 401,
              message: 'No refresh token available',
              code: 'NO_REFRESH_TOKEN'
            } as AuthError});
            return false;
          }
          
          const response = await authService.refreshToken(refreshToken);
          
          if (!response.success || !response.data) {
            dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: {
              statusCode: 401,
              message: response.error || 'Failed to refresh token',
              code: 'REFRESH_FAILED'
            } as AuthError});
            
            // Handle token expiration by redirecting to login
            handleTokenExpiration();
            return false;
          }
          
          // Store new tokens
          const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
          storeTokens(response.data, rememberMe);
          
          // Setup token refresh timer for new tokens
          setupTokenRefreshTimer(response.data);
          
          // Get user profile with new token
          const userResponse = await authService.getUserProfile();
          
          if (userResponse.success && userResponse.data) {
            dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: userResponse.data });
            return true;
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
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      clearTokenRefreshTimer();
    };
  }, []);
  
  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
    
    // Setup event listener for storage changes (for multi-tab support)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.ACCESS_TOKEN || event.key === STORAGE_KEYS.REFRESH_TOKEN) {
        initializeAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Setup activity tracking for session management
  useEffect(() => {
    const trackActivity = () => {
      if (state.isAuthenticated) {
        dispatch({ 
          type: 'UPDATE_ACTIVITY', 
          payload: new Date().toISOString() 
        });
      }
    };
    
    // Track user activity
    window.addEventListener('click', trackActivity);
    window.addEventListener('keypress', trackActivity);
    window.addEventListener('scroll', trackActivity);
    window.addEventListener('mousemove', trackActivity);
    
    return () => {
      window.removeEventListener('click', trackActivity);
      window.removeEventListener('keypress', trackActivity);
      window.removeEventListener('scroll', trackActivity);
      window.removeEventListener('mousemove', trackActivity);
    };
  }, [state.isAuthenticated]);

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

  /**
   * Handle token expiration by redirecting to login
   */
  const handleTokenExpiration = (): void => {
    // Clear authentication data
    clearTokens();
    clearUserData();
    
    // Store intended redirect path before redirecting
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/auth/login') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // Redirect to login page with expired flag
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login?expired=true';
      }
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

  /**
   * Parse JWT token to extract expiration time
   */
  const getTokenExpiration = (token: string): number | null => {
    if (!token) return null;
    
    try {
      // Extract payload from JWT token (middle part between dots)
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      
      // Convert base64url to base64 and decode
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      // Get expiration time
      if (payload && payload.exp) {
        return payload.exp;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return null;
    }
  };
  
  /**
   * Check if token is about to expire within threshold
   */
  const isTokenExpiringSoon = (token: string): boolean => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return false;
    
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const threshold = 5 * 60; // 5 minutes in seconds
    
    return expiration - now <= threshold;
  };
  
  /**
   * Setup token refresh timer based on token expiration
   */
  const setupTokenRefreshTimer = useCallback((tokens: TokenPair): void => {
    // Clear any existing timer
    clearTokenRefreshTimer();
    
    if (!tokens.accessToken?.token) return;
    
    const expiration = getTokenExpiration(tokens.accessToken.token);
    if (!expiration) return;
    
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const tokenRefreshThreshold = 5 * 60; // 5 minutes before expiry
    const timeUntilRefresh = Math.max(0, expiration - currentTime - tokenRefreshThreshold);
    
    console.log(`Setting up token refresh in ${timeUntilRefresh} seconds`);
    
    // Set timer to refresh token before it expires
    tokenRefreshTimerRef.current = setTimeout(async () => {
      console.log('Token refresh timer triggered');
      try {
        const success = await refreshToken();
        if (success) {
          console.log('Scheduled token refresh successful');
          // Get updated tokens and setup next refresh
          const newTokens = getStoredTokens();
          if (newTokens) {
            setupTokenRefreshTimer(newTokens);
          }
        } else {
          console.error('Scheduled token refresh failed - redirecting to login');
          handleTokenExpiration();
        }
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
        handleTokenExpiration();
      }
    }, timeUntilRefresh * 1000); // Convert to milliseconds
  }, []);

  /**
   * Clear token refresh timer
   */
  const clearTokenRefreshTimer = (): void => {
    if (tokenRefreshTimerRef.current) {
      clearTimeout(tokenRefreshTimerRef.current);
      tokenRefreshTimerRef.current = null;
    }
  };
  
  // Refresh token
  const refreshToken = async (): Promise<boolean> => {
    // Skip if refresh is already in progress
    if (state.tokenRefreshInProgress) {
      return false;
    }
    
    dispatch({ type: 'TOKEN_REFRESH_START' });
    try {
      // Get stored tokens
      const tokens = getStoredTokens();
      if (!tokens || !tokens.refreshToken?.token) {
        dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: {
          statusCode: 401,
          message: 'No refresh token available',
          code: 'NO_REFRESH_TOKEN'
        } as AuthError});
        handleTokenExpiration();
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
        handleTokenExpiration();
        return false;
      }
      
      // Store new tokens
      const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
      storeTokens(response.data, rememberMe);
      
      // Setup token refresh timer for new tokens
      setupTokenRefreshTimer(response.data);
      
      // Get user profile with new token to ensure user data is fresh
      try {
        const userResponse = await authService.getUserProfile();
        
        if (userResponse.success && userResponse.data) {
          // Store updated user data
          storeUserData(userResponse.data);
          dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: userResponse.data });
          return true;
        } else {
          // Token refresh succeeded but user profile failed - still consider success
          console.warn('Token refresh succeeded but user profile fetch failed');
          dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: state.user });
          return true;
        }
      } catch (profileError) {
        // Token refresh succeeded but user profile failed - still consider success
        console.warn('Token refresh succeeded but user profile fetch failed:', profileError);
        dispatch({ type: 'REFRESH_TOKEN_SUCCESS', payload: state.user });
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      clearUserData();
      
      dispatch({ type: 'REFRESH_TOKEN_ERROR', payload: error as AuthError });
      
      // Handle token expiration by redirecting to login
      handleTokenExpiration();
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

// Expose auth context for testing purposes
if (typeof window !== 'undefined') {
  window._getAuthContext = () => {
    try {
      return useAuth();
    } catch (error) {
      console.error('Error accessing AuthContext:', error);
      return null;
    }
  };
}

