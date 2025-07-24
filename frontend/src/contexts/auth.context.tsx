'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { User, AuthError, AuthContextType, AuthState, AuthAction } from '../types/auth.types';
import { authService } from '../services/auth.service';
import type { VerifyEmailRequest, ResendVerificationRequest, UpdateProfileRequest } from '../types/auth.types';

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        error: null,
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
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (state.isAuthenticated) {
      setupTokenRefresh();
    }
  }, [state.isAuthenticated]);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Only run on client side to prevent hydration mismatch
      if (typeof window === 'undefined') {
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      // Check if user has a valid token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

      if (!token) {
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      // Verify token and get user profile using the new auth service methods
      const tokenResponse = await authService.verifyToken();
      
      if (tokenResponse.success && tokenResponse.data?.valid && tokenResponse.data.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: tokenResponse.data.user });
      } else {
        // Token invalid, try to refresh
        try {
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success) {
            // Get user data after successful refresh
            const userResponse = await authService.getCurrentUser();
            if (userResponse.success && userResponse.data) {
              dispatch({ type: 'AUTH_SUCCESS', payload: userResponse.data });
            } else {
              throw new Error('Failed to get user data after token refresh');
            }
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          // Both token verification and refresh failed, clear tokens
          clearTokens();
          dispatch({ type: 'AUTH_ERROR', payload: null });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearTokens();
      dispatch({ type: 'AUTH_ERROR', payload: error as AuthError });
    }
  };

  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      // Clear authentication tokens
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // Clear user data
      localStorage.removeItem('user_data');
      sessionStorage.removeItem('user_data');
      
      // Clear registration-related data
      localStorage.removeItem('userEmail');
      localStorage.removeItem('emailVerified');
      
      // Clear any other auth-related data
      localStorage.removeItem('registration_success');
    }
  };

  // Set up automatic token refresh
  const setupTokenRefresh = () => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Clear any existing refresh interval
    if ((window as any).authRefreshInterval) {
      clearInterval((window as any).authRefreshInterval);
    }

    // Set up token refresh every 14 minutes (1 minute before expiry)
    const refreshInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

        if (token && state.isAuthenticated) {
          await authService.refreshToken();
        } else {
          // No token or not authenticated, clear interval
          clearInterval(refreshInterval);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout user
        logout();
      }
    }, 14 * 60 * 1000); // 14 minutes

    // Store interval reference for cleanup
    (window as any).authRefreshInterval = refreshInterval;
  };

  // Check authentication status
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? 
        localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') : 
        null;

      if (!token) {
        return false;
      }

      // Verify token with backend
      const response = await authService.verifyToken();
      
      if (response.success && response.data?.valid) {
        // Update user data if token is valid
        if (response.data.user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
        }
        return true;
      } else {
        // Token invalid, try to refresh
        try {
          const refreshResponse = await authService.refreshToken();
          if (refreshResponse.success) {
            // Get updated user data
            const userResponse = await authService.getCurrentUser();
            if (userResponse.success && userResponse.data) {
              dispatch({ type: 'AUTH_SUCCESS', payload: userResponse.data });
              return true;
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed during status check:', refreshError);
        }
        
        // Both verification and refresh failed
        clearTokens();
        dispatch({ type: 'AUTH_LOGOUT' });
        return false;
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });

      const response = await authService.login(email, password, rememberMe);
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
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
      dispatch({ type: 'AUTH_START' });

      const response = await authService.registerUser(userData);
      
      if (response.success) {
        // Registration successful, but user needs to verify email
        dispatch({ type: 'SET_LOADING', payload: false });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const authError = error as AuthError;
      dispatch({ type: 'AUTH_ERROR', payload: authError });
      throw authError;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API to invalidate token on server
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      // Clear all local authentication data
      clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Update user profile
  const updateProfile = async (userData: UpdateProfileRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Note: updateUserProfile method needs to be implemented in auth service
      // For now, we'll use getCurrentUser to refresh user data
      const response = await authService.getCurrentUser();
      
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

      const verifyRequest: VerifyEmailRequest = { token };
      const response = await authService.verifyEmail(verifyRequest);
      
      if (response.success && response.data) {
        // Update user with verified status
        dispatch({ type: 'UPDATE_USER', payload: response.data.user });
        
        // Mark email as verified in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('emailVerified', 'true');
        }
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

      const resendRequest: ResendVerificationRequest = { email };
      const response = await authService.resendVerificationEmail(resendRequest);
      
      // ResendVerificationResponse doesn't have success property, so we check if response exists
      if (!response) {
        throw new Error('Failed to resend verification email');
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
  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    
    // Permission checks based on user status and roles
    switch (permission) {
      case 'verified':
        return state.user.status === 'verified';
      
      case 'booking':
        // Booking features require verified users
        return state.user.status === 'verified';
      
      case 'profile':
        // Profile access for authenticated users (verified or unverified)
        return state.isAuthenticated;
      
      case 'admin':
        // Admin permissions (if roles are added later)
        return false; // TODO: Implement role-based permissions
      
      default:
        // Default: allow if authenticated
        return state.isAuthenticated;
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
    logout,
    register,
    updateProfile,
    verifyEmail,
    resendVerification,
    clearError,
    hasPermission,
    checkAuthStatus,
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
