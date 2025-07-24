'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VerificationResult from '../../../components/auth/VerificationResult';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token from URL search params
    const tokenParam = searchParams.get('token');
    setToken(tokenParam);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Verification
          </h1>
          <p className="text-gray-600">
            {!token ? 'Looking for verification token...' : 'Verifying your email address...'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {token ? <VerificationResult token={token} /> : <p>No verification token found. Please check your email link.</p>}
        </div>
      </div>
    </div>
  );
}
