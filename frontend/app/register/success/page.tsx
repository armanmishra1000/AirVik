'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VerificationSuccess from '../../../src/components/auth/VerificationSuccess';

export default function RegisterSuccessPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Access
              </h2>
              <p className="text-gray-600 mb-4">
                This page requires a valid email parameter.
              </p>
              <a
                href="/register"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Registration
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <VerificationSuccess
          email={email}
          onResendSuccess={() => {
            // Could show a toast notification here
            console.log('Verification email resent successfully');
          }}
          onResendError={(error) => {
            console.error('Failed to resend verification email:', error);
          }}
        />
      </div>
    </div>
  );
}
