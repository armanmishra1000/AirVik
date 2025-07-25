'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function RegistrationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('registrationEmail');
    
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('registrationEmail', emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email is found, redirect to register page
      router.push('/auth/register');
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResendEmail = async () => {
    if (!canResend || !email) return;
    
    try {
      // Reset the countdown and disable the button
      setCanResend(false);
      setCountdown(60);
      
      // Redirect to resend verification page with email parameter
      router.push(`/auth/resend-verification?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error('Error resending verification email:', error);
      // Re-enable the button if there's an error
      setCanResend(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
              <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Registration Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              We've sent a verification email to your inbox.
            </p>

            {/* Email Info Box */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">
                Verification email sent to:
              </p>
              <p className="text-base font-medium text-gray-800">
                {email || 'your email address'}
              </p>
            </div>

            {/* Next Steps */}
            <div className="text-left mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Next Steps:
              </h3>
              <ol className="text-gray-600 space-y-2 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Complete your account setup</li>
                <li>Start using AirVik!</li>
              </ol>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-6"></div>

            {/* Didn't receive section */}
            <div className="text-left">
              <h3 className="text-base font-medium text-gray-900 mb-3">
                Didn't receive the email?
              </h3>
              
              <button
                onClick={handleResendEmail}
                disabled={!canResend}
                className={`w-full py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white 
                  ${canResend 
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                    : 'bg-gray-400 cursor-not-allowed'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`}
              >
                {canResend ? 'Resend Verification Email' : `Resend in ${countdown}s`}
              </button>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Check your spam folder if you don't see the email in your inbox
              </p>
            </div>

            {/* Back to Login Link */}
            <div className="mt-6 text-center">
              <Link 
                href="/auth/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
