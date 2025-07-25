'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthError, AuthContextType, AuthState, AuthAction } from '../types/auth.types';
import { authService } from '../services/auth.service';

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

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'AUTH_START' });

      // Check if user has a valid token
      const token = typeof window !== 'undefined' ? 
        localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') : 
        null;

      if (!token) {
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      // Verify token and get user profile
      const response = await authService.getUserProfile();
      
      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data });
      } else {
        // Invalid token, clear it
        clearTokens();
        dispatch({ type: 'AUTH_ERROR', payload: null });
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
        // Update user status to verified
        dispatch({ type: 'UPDATE_USER', payload: response.data });
        
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
    register,
    logout,
    updateProfile,
    verifyEmail,
    resendVerification,
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
