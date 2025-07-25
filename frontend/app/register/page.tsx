'use client';

import React from 'react';
import RegistrationForm from '../../src/components/auth/RegistrationForm';

// Note: Metadata is handled in layout.tsx for client components
const metadata = {
  title: 'Sign Up - AirVik',
  description: 'Create your AirVik account to start booking hotels and managing your reservations.',
  keywords: 'sign up, register, create account, AirVik, hotel booking',
  openGraph: {
    title: 'Sign Up - AirVik',
    description: 'Create your AirVik account to start booking hotels and managing your reservations.',
    type: 'website',
  },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Register Form
          </h1>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegistrationForm
          onSuccess={(user) => {
            // Redirect to success page with email
            window.location.href = `/register/success?email=${encodeURIComponent(user.email)}`;
          }}
          onError={(error) => {
            // Registration error handled by UI - no console logging needed
          }}
          className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        />
      </div>

      {/* Additional Links */}
      {/* <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a
            href="/auth/login"
            className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign in here
          </a>
        </p>
      </div> */}
    </div>
  );
}
