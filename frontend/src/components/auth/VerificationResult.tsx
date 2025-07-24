'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth.service';
import { User, AuthError } from '../../types/auth.types';

interface VerificationResultProps {
  token: string;
  onSuccess?: (user: User) => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

type VerificationState = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

const VerificationResult: React.FC<VerificationResultProps> = ({
  token,
  onSuccess,
  onError,
  className = ''
}) => {
  const router = useRouter();
  
  // State management
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  /**
   * Verify email token on component mount
   */
  useEffect(() => {
    if (!token) {
      setVerificationState('invalid');
      setError('No verification token provided');
      return;
    }

    verifyEmailToken();
  }, [token]);

  /**
   * Auto-redirect countdown for successful verification
   */
  useEffect(() => {
    if (verificationState === 'success' && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (verificationState === 'success' && redirectCountdown === 0) {
      handleRedirectToLogin();
    }
  }, [verificationState, redirectCountdown]);

  /**
   * Verify email token with backend
   */
  const verifyEmailToken = async () => {
    try {
      setVerificationState('loading');
      setError(null);
      
      // Call the API endpoint to verify the email token
      const response = await authService.verifyEmail({ token });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setVerificationState('success');
        
        // Store the user data in local storage (but not auth token since login is still required)
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('emailVerified', 'true');
        
        if (onSuccess) {
          onSuccess(response.data.user);
        }
        
        console.log('Email verification successful:', response.data);
      } else {
        throw new Error(response.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      
      const authError = error as AuthError;
      
      // Handle specific backend error responses
      if (authError.statusCode === 400) {
        if (authError.message?.toLowerCase().includes('expired') || authError.message?.toLowerCase().includes('token has expired')) {
          setVerificationState('expired');
          setError('Your verification link has expired. Please request a new one.');
        } else if (authError.message?.toLowerCase().includes('invalid') || authError.message?.toLowerCase().includes('token is invalid')) {
          setVerificationState('invalid');
          setError('Invalid verification link. Please check your email or request a new link.');
        } else {
          setVerificationState('error');
          setError(authError.message || 'Verification failed. Please try again.');
        }
      } else if (authError.statusCode === 404) {
        setVerificationState('invalid');
        setError('Verification token not found. Please request a new verification email.');
      } else if (authError.statusCode === 409 || authError.message?.toLowerCase().includes('already verified')) {
        // User already verified - treat as success but show different message
        setVerificationState('success');
        setError('Your email has already been verified. You can now log in to your account.');
        // Auto-redirect to login since already verified
        setTimeout(() => handleRedirectToLogin(), 3000);
      } else if (authError.statusCode === 429) {
        setVerificationState('error');
        setError('Too many verification attempts. Please try again later.');
      } else if (authError.isNetworkError) {
        setVerificationState('error');
        setError('Network error. Please check your connection and try again.');
      } else {
        setVerificationState('error');
        setError(authError.message || 'Verification failed. Please try again.');
      }
      
      if (onError) {
        onError(authError);
      }
    }
  };

  /**
   * Redirect to login page
   */
  const handleRedirectToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  /**
   * Navigate to registration page
   */
  const handleGoToRegister = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  /**
   * Navigate to resend verification page
   */
  const handleResendVerification = useCallback(() => {
    // Pass the user's email if available for convenience
    const userEmail = user?.email || localStorage.getItem('userEmail');
    const url = userEmail ? `/auth/resend-verification?email=${encodeURIComponent(userEmail)}` : '/auth/resend-verification';
    router.push(url);
  }, [router, user]);

  /**
   * Retry verification with the same token
   */
  const handleRetryVerification = useCallback(() => {
    verifyEmailToken();
  }, []);

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Verifying Your Email
      </h2>
      <p className="text-gray-600">
        Please wait while we verify your email address...
      </p>
    </div>
  );

  /**
   * Render success state
   */
  const renderSuccess = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Email Verified Successfully!
      </h2>
      <p className="text-gray-600 mb-4">
        Welcome to AirVik, {user?.firstName}! Your account is now active.
      </p>
      
      {/* User Info */}
      {user && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>Account:</strong> {user.email}
          </p>
          <p className="text-sm text-green-800">
            <strong>Name:</strong> {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-green-600">
            <strong>Status:</strong> {user.status === 'verified' ? 'Verified' : 'Active'}
          </p>
        </div>
      )}

      {/* Auto-redirect message */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          Redirecting to login in {redirectCountdown} seconds...
        </p>
      </div>

      <button
        onClick={handleRedirectToLogin}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        Continue to Login
      </button>
    </div>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {verificationState === 'expired' ? 'Link Expired' : 
         verificationState === 'invalid' ? 'Invalid Link' : 
         'Verification Failed'}
      </h2>
      <p className="text-gray-600 mb-6">
        {error}
      </p>

      {/* Action buttons based on error type */}
      <div className="space-y-3">
        {(verificationState === 'expired' || verificationState === 'invalid') ? (
          <>
            <button
              onClick={handleResendVerification}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Request New Verification Email
            </button>
            <button
              onClick={handleGoToRegister}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
            >
              Create New Account
            </button>
          </>
        ) : (
          <button
            onClick={handleRetryVerification}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={handleRedirectToLogin}
          className="w-full py-2 px-4 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-md p-6 ${className}`}>
      {verificationState === 'loading' && renderLoading()}
      {verificationState === 'success' && renderSuccess()}
      {(verificationState === 'error' || verificationState === 'expired' || verificationState === 'invalid') && renderError()}
    </div>
  );
};

export default VerificationResult;