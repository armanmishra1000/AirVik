'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '../../services/auth.service';
import { AuthError, VerificationRateLimitInfo, ResendVerificationResponse } from '../../types/auth.types';
import { validateEmail } from '../../utils/validation';

interface ResendVerificationProps {
  initialEmail?: string;
  onSuccess?: (email: string) => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

const ResendVerification: React.FC<ResendVerificationProps> = ({
  initialEmail = '',
  onSuccess,
  onError,
  className = ''
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get email from URL parameters if available
  const emailFromUrl = searchParams.get('email') || '';
  
  // State management
  const [email, setEmail] = useState(initialEmail || emailFromUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    attempts: number;
    maxAttempts: number;
    resetTime?: Date;
  } | null>(null);

  // Timer for rate limiting
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && !canResend) {
      setCanResend(true);
      setRateLimitInfo(null);
    }
  }, [timeRemaining, canResend]);

  /**
   * Handle email input change
   */
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setEmailError(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, []);

  /**
   * Validate email field
   */
  const validateEmailField = (): boolean => {
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setEmailError(validation.message);
      return false;
    }
    setEmailError(null);
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmailField() || !canResend || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      // Call the API endpoint to resend verification email
      const response = await authService.resendVerificationEmail(email);
      
      if (response.success) {
        // Keep the email for potential future resends
        setSuccessMessage(
          `Verification email sent successfully to ${email}. Please check your inbox and spam folder.`
        );
        
        // Set rate limiting based on API response or default to 60 seconds
        const responseData = response.data as ResendVerificationResponse | undefined;
        const cooldownPeriod = responseData?.cooldown || 60;
        setCanResend(false);
        setTimeRemaining(cooldownPeriod);
        
        // If API provides rate limit info, use it
        if (responseData?.rateLimitInfo) {
          setRateLimitInfo({
            attempts: responseData.rateLimitInfo.attempts,
            maxAttempts: responseData.rateLimitInfo.maxAttempts,
            resetTime: new Date(responseData.rateLimitInfo.resetTime)
          });
        }
        
        // Store email in localStorage for convenience
        localStorage.setItem('userEmail', email);
        
        if (onSuccess) {
          onSuccess(email);
        }
      } else {
        // Handle unexpected success:false response
        throw new Error(response.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      
      const authError = error as AuthError;
      
      // Handle specific backend error responses
      if (authError.statusCode === 429) {
        const retryAfter = authError.retryAfter || 60;
        setCanResend(false);
        setTimeRemaining(retryAfter);
        setErrorMessage(
          `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        );
        
        // Set rate limit info if available
        if (authError.rateLimitInfo) {
          setRateLimitInfo({
            attempts: authError.rateLimitInfo.attempts,
            maxAttempts: authError.rateLimitInfo.maxAttempts,
            resetTime: new Date(authError.rateLimitInfo.resetTime)
          });
        }
      } else if (authError.statusCode === 404) {
        setErrorMessage('User not found. Please check your email address or create a new account.');
      } else if (authError.statusCode === 400) {
        if (authError.message?.toLowerCase().includes('already verified')) {
          setErrorMessage('Your email is already verified. You can log in to your account.');
          // Auto-redirect to login after 3 seconds
          setTimeout(() => handleGoToLogin(), 3000);
        } else if (authError.message?.toLowerCase().includes('validation')) {
          setErrorMessage('Please provide a valid email address.');
          setEmailError('Invalid email format');
        } else {
          setErrorMessage(authError.message || 'Invalid request. Please check your email address.');
        }
      } else if (authError.statusCode === 409) {
        setErrorMessage('Your email is already verified. You can log in to your account.');
        setTimeout(() => handleGoToLogin(), 3000);
      } else if (authError.isNetworkError) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage(authError.message || 'Failed to send verification email. Please try again.');
      }
      
      if (onError) {
        onError(authError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navigate to login page
   */
  const handleGoToLogin = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  /**
   * Navigate to registration page
   */
  const handleGoToRegister = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  /**
   * Format time remaining for display
   */
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      : `${remainingSeconds}s`;
  };

  /**
   * Format rate limit reset time
   */
  const formatResetTime = (resetTime: Date): string => {
    const now = new Date();
    const diff = Math.max(0, resetTime.getTime() - now.getTime());
    const minutes = Math.ceil(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Resend Verification Email
        </h2>
        <p className="text-gray-600">
          Enter your email address to receive a new verification link
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Rate Limit Info */}
      {rateLimitInfo && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Rate limit reached</p>
              <p>
                You've made {rateLimitInfo.attempts} of {rateLimitInfo.maxAttempts} attempts.
                {rateLimitInfo.resetTime && (
                  <> Try again in {formatResetTime(rateLimitInfo.resetTime)}.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={validateEmailField}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
            required
            disabled={isSubmitting}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError && (
            <p id="email-error" className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canResend || isSubmitting || !email}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${!canResend || isSubmitting || !email
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition-colors duration-200`}
          aria-label={canResend ? 'Send verification email' : `Wait ${formatTimeRemaining(timeRemaining)} to resend`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : canResend ? (
            'Send Verification Email'
          ) : (
            `Wait ${formatTimeRemaining(timeRemaining)}`
          )}
        </button>

        {/* Help Text */}
        {!canResend && timeRemaining > 0 && (
          <p className="text-xs text-gray-500 text-center">
            Please wait before requesting another verification email
          </p>
        )}
      </form>

      {/* Navigation Links */}
      <div className="mt-6 flex flex-col space-y-2">
        <button
          onClick={handleGoToLogin}
          className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-center"
        >
          Back to Login
        </button>
        <button
          onClick={handleGoToRegister}
          className="text-sm text-gray-600 hover:text-gray-800 underline focus:outline-none focus:ring-2 focus:ring-gray-500 rounded text-center"
        >
          Create New Account
        </button>
      </div>

      {/* Additional Help */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Still having trouble?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Check your spam/junk folder</li>
          <li>• Make sure you entered the correct email address</li>
          <li>• Contact support if the problem persists</li>
        </ul>
      </div>
    </div>
  );
};

export default ResendVerification;
