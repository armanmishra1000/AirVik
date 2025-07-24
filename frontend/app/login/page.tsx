'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { useAuth } from '../../src/contexts/auth.context';
import LoginForm from '../../src/components/auth/LoginForm';
import Link from 'next/link';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [returnUrl, setReturnUrl] = useState('/dashboard');
  const [message, setMessage] = useState<string | null>(null);

  // Handle client-side mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Get search params only on client side
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setReturnUrl(urlParams.get('returnUrl') || '/dashboard');
      setMessage(urlParams.get('message'));
    }
  }, []);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user is already logged in, redirect them to dashboard or return URL
      router.replace(returnUrl);
    }
  }, [isAuthenticated, isLoading, router, returnUrl]);

  // Show loading state while checking authentication or during mounting
  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if user is authenticated (prevents flash)
  if (isAuthenticated) {
    return null;
  }

  const handleLoginSuccess = () => {
    // LoginForm component handles the redirect internally
    // This callback can be used for additional actions if needed
    console.log('Login successful, redirecting...');
  };

  return (
    <>
      <Head>
        <title>Login - AirVik Hotel Booking</title>
        <meta name="description" content="Sign in to your AirVik account to manage your hotel bookings and reservations." />
        <meta name="keywords" content="login, sign in, hotel booking, account access" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AirVik</h1>
          <p className="text-sm text-gray-600">Hotel Booking System</p>
        </div>

        {/* Page Title */}
        <h2 className="mt-8 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        
        {/* Optional message display */}
        {message && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 text-center">{message}</p>
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Login Form */}
          <LoginForm
            onSuccess={handleLoginSuccess}
            redirectTo={returnUrl}
            className="space-y-6"
          />

          {/* Additional Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to AirVik?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Create your account
              </Link>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-500 transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
};

export default LoginPage;
