'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import VerificationResult from '../../../../components/auth/VerificationResult';

export default function VerifyTokenPage() {
  const params = useParams();
  const token = params.token as string;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <VerificationResult
          token={token}
          onSuccess={(user) => {
            console.log('Email verified successfully for user:', user.email);
            // Additional success handling can be added here
          }}
          onError={(error) => {
            console.error('Email verification failed:', error);
            // Additional error handling can be added here
          }}
        />
      </div>
    </div>
  );
}
