import React from 'react';
import { Metadata } from 'next';
import ResendVerification from '../../../src/components/auth/ResendVerification';

export const metadata: Metadata = {
  title: 'Resend Verification Email - AirVik',
  description: 'Request a new email verification link for your AirVik account.',
  robots: 'noindex, nofollow', // Don't index this page
};

export default function ResendVerificationPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <ResendVerification
          onSuccess={(email) => {
            console.log('Verification email sent to:', email);
            // Could redirect to success page or show toast
          }}
          onError={(error) => {
            console.error('Failed to resend verification email:', error);
          }}
        />
      </div>
    </div>
  );
}
