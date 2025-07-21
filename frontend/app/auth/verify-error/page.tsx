import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verification Error - AirVik',
  description: 'There was an issue verifying your email address.',
  robots: 'noindex, nofollow', // Don't index this page
};

export default function VerifyErrorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn't verify your email address. This could be due to an expired or invalid verification link.
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              <a
                href="/auth/resend-verification"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Request New Verification Email
              </a>
              
              <a
                href="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Create New Account
              </a>
              
              <a
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Back to Login
              </a>
            </div>

            {/* Help Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h3>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• Check if the verification link has expired</li>
                <li>• Make sure you clicked the correct link from your email</li>
                <li>• Check your spam/junk folder for the verification email</li>
                <li>• Contact support if the problem persists</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
