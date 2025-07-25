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
      
      const response = await authService.verifyEmail(token);
      
      if (response.success && response.data) {
        setUser(response.data);
        setVerificationState('success');
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      
      const authError = error as AuthError;
      
      // Determine error type based on status code or message
      if (authError.statusCode === 400 || authError.message?.includes('expired')) {
        setVerificationState('expired');
        setError('Your verification link has expired. Please request a new one.');
      } else if (authError.statusCode === 404 || authError.message?.includes('invalid')) {
        setVerificationState('invalid');
        setError('Invalid verification link. Please check your email or request a new link.');
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
    router.push('/auth/login');
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
    router.push('/auth/resend-verification');
  }, [router]);

  /**
   * Retry verification
   */
  const handleRetryVerification = useCallback(() => {
    verifyEmailToken();
  }, [token]);

  /**
   * Render loading state
   */
  const renderLoading = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 mb-6">
        <svg className="animate-spin h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Verifying Your Email
      </h2>
      <p className="text-gray-600 text-lg">
        Please wait while we verify your email address...
      </p>
      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          This should only take a moment. If it takes longer than expected, you can refresh the page to try again.
        </p>
      </div>
    </div>
  );

  /**
   * Render success state
   */
  const renderSuccess = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
        <svg className="h-14 w-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Email Verified Successfully!
      </h2>
      <p className="text-gray-600 mb-6 text-lg">
        Welcome to AirVik, {user?.firstName}! Your account is now active and ready to use.
      </p>
      
      {/* User Info */}
      {user && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
          <div className="flex items-center mb-2">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm text-green-800 font-medium">
              <strong>Account:</strong> {user.email}
            </p>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-800 font-medium">
              <strong>Name:</strong> {user.firstName} {user.lastName}
            </p>
          </div>
        </div>
      )}

      {/* Auto-redirect message */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800">
            Redirecting to login in <span className="font-bold">{redirectCountdown}</span> seconds...
          </p>
        </div>
      </div>

      <button
        onClick={handleRedirectToLogin}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-lg"
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
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
        {verificationState === 'expired' ? (
          <svg className="h-14 w-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="h-14 w-14 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        {verificationState === 'expired' ? 'Link Expired' : 
         verificationState === 'invalid' ? 'Invalid Link' : 
         'Verification Failed'}
      </h2>
      <p className="text-gray-600 mb-6 text-lg">
        {error}
      </p>

      {/* Error details box */}
      <div className="bg-red-50 border border-red-100 rounded-lg p-5 mb-6">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-red-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-red-800 font-medium mb-2">
              {verificationState === 'expired' ? 
                'Your verification link has expired.' : 
                verificationState === 'invalid' ? 
                'The verification link is invalid or has already been used.' : 
                'There was a problem verifying your email.'}
            </p>
            <p className="text-sm text-red-700">
              {verificationState === 'expired' ? 
                'Please request a new verification email to complete your account setup.' : 
                verificationState === 'invalid' ? 
                'Please check that you have used the correct link from your email or request a new one.' : 
                'Please try again or contact support if the problem persists.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons based on error type */}
      <div className="space-y-4">
        {(verificationState === 'expired' || verificationState === 'invalid') ? (
          <>
            <button
              onClick={handleResendVerification}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-lg"
            >
              Request New Verification Email
            </button>
            <button
              onClick={handleGoToRegister}
              className="w-full py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 text-lg"
            >
              Create New Account
            </button>
          </>
        ) : (
          <button
            onClick={handleRetryVerification}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-lg"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={handleRedirectToLogin}
          className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 text-lg"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className={`max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 ${className}`}>
      {verificationState === 'loading' && renderLoading()}
      {verificationState === 'success' && renderSuccess()}
      {(verificationState === 'error' || verificationState === 'expired' || verificationState === 'invalid') && renderError()}
    </div>
  );
};

export default VerificationResult;
