'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth.context';

interface VerificationPromptProps {
  title?: string;
  message?: string;
  feature?: string;
  showResendButton?: boolean;
  className?: string;
}

const VerificationPrompt: React.FC<VerificationPromptProps> = ({
  title = 'Email Verification Required',
  message,
  feature = 'this feature',
  showResendButton = true,
  className = ''
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const defaultMessage = `To access ${feature}, please verify your email address. We've sent a verification link to ${user?.email || 'your email'}.`;

  const handleResendVerification = () => {
    const email = user?.email || localStorage.getItem('userEmail') || '';
    const url = email ? `/auth/resend-verification?email=${encodeURIComponent(email)}` : '/auth/resend-verification';
    router.push(url);
  };

  const handleGoToProfile = () => {
    router.push('/profile');
  };

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{message || defaultMessage}</p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            {showResendButton && (
              <button
                onClick={handleResendVerification}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Resend Verification Email
              </button>
            )}
            <button
              onClick={handleGoToProfile}
              className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm leading-4 font-medium rounded-md text-yellow-800 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPrompt;
