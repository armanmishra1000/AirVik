'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../services/auth.service';
import { AuthError } from '../../types/auth.types';

interface VerificationSuccessProps {
  email: string;
  onResendSuccess?: () => void;
  onResendError?: (error: AuthError) => void;
  className?: string;
}

const VerificationSuccess: React.FC<VerificationSuccessProps> = ({
  email,
  onResendSuccess,
  onResendError,
  className = ''
}) => {
  const router = useRouter();
  
  // State management
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 60 seconds cooldown

  // Timer for resend cooldown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeRemaining]);

  /**
   * Handle resend verification email
   */
  const handleResendVerification = useCallback(async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    try {
      await authService.resendVerificationEmail(email);
      
      setResendMessage('Verification email sent successfully! Please check your inbox.');
      setCanResend(false);
      setTimeRemaining(60); // Reset cooldown
      
      if (onResendSuccess) {
        onResendSuccess();
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      
      const authError = error as AuthError;
      const errorMessage = authError.message || 'Failed to resend verification email. Please try again.';
      setResendError(errorMessage);
      
      if (onResendError) {
        onResendError(authError);
      }
    } finally {
      setIsResending(false);
    }
  }, [email, canResend, isResending, onResendSuccess, onResendError]);

  /**
   * Navigate to login page
   */
  const handleGoToLogin = useCallback(() => {
    router.push('/auth/login');
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

  return (
    <div className={`max-w-md mx-auto bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Success Icon */}
      <div className="text-center mb-6">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg 
            className="h-8 w-8 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Successful!
        </h2>
        <p className="text-gray-600">
          We've sent a verification email to your inbox.
        </p>
      </div>

      {/* Email Display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">Verification email sent to:</p>
        <p className="font-medium text-gray-900 break-all">{email}</p>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Next Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Check your email inbox (and spam folder)</li>
          <li>Click the verification link in the email</li>
          <li>Complete your account setup</li>
          <li>Start using AirVik!</li>
        </ol>
      </div>

      {/* Resend Section */}
      <div className="border-t pt-6">
        <h4 className="font-medium text-gray-900 mb-3">Didn't receive the email?</h4>
        
        {/* Success Message */}
        {resendMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{resendMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {resendError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{resendError}</p>
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResendVerification}
          disabled={!canResend || isResending}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${!canResend || isResending
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition-colors duration-200`}
          aria-label={canResend ? 'Resend verification email' : `Wait ${formatTimeRemaining(timeRemaining)} to resend`}
        >
          {isResending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : canResend ? (
            'Resend Verification Email'
          ) : (
            `Resend in ${formatTimeRemaining(timeRemaining)}`
          )}
        </button>

        {/* Help Text */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Check your spam folder if you don't see the email in your inbox
        </p>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <button
          onClick={handleGoToLogin}
          className="text-sm text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
};

export default VerificationSuccess;VerificationSuccess
