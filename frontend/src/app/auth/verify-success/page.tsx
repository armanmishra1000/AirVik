import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Verified - AirVik',
  description: 'Your email has been successfully verified. Welcome to AirVik!',
  robots: 'noindex, nofollow', // Don't index this page
};

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Welcome to AirVik! Your account is now active and ready to use.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign In to Your Account
              </a>
              
              <a
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Go to Homepage
              </a>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Sign in to access your account</li>
                <li>• Complete your profile setup</li>
                <li>• Start browsing and booking hotels</li>
                <li>• Manage your reservations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
