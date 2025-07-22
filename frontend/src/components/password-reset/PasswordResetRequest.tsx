'use client';

import React, { useState } from 'react';
import { passwordResetService } from '../../services/password-reset.service';
import { PasswordResetRequestProps, ApiError } from '../../types/password-reset.types';

export const PasswordResetRequest: React.FC<PasswordResetRequestProps> = ({
  onSuccess,
  onError,
  className = '',
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const validateEmail = (email: string): string | null => {
    // TODO: Implement comprehensive email validation
    // TODO: Check email format using regex
    // TODO: Check for common email issues
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Validate email before submission
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      // TODO: Call password reset service
      const result = await passwordResetService.requestPasswordReset(email);
      
      setSuccess(true);
      setError(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.error);
      setRetryAfter(apiError.retryAfter || null);
      
      if (onError) {
        onError(apiError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryAfter(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className={`max-w-md mx-auto bg-white p-8 rounded-lg shadow-md ${className}`}>
        <div className="text-center">
          {/* TODO: Add success icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
          
          <p className="text-gray-600 mb-6">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
          
          <button
            onClick={handleRetry}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Send another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto bg-white p-8 rounded-lg shadow-md ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
        <p className="text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email address"
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm text-red-700">{error}</p>
                {retryAfter && (
                  <p className="text-xs text-red-600 mt-1">
                    Please wait {Math.ceil(retryAfter / 60)} minutes before trying again.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </div>
          ) : (
            'Send Reset Instructions'
          )}
        </button>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Login
          </a>
        </div>
      </form>
    </div>
  );
};
