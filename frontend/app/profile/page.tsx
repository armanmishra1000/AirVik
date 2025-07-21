'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UserProfile from '../../src/components/user/UserProfile';
import { User, AuthError } from '../../src/types/auth.types';
import { authService } from '../../src/services/auth.service';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    try {
      // Check if user is authenticated (you might want to implement this in authService)
      const token = typeof window !== 'undefined' ? 
        localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') : 
        null;

      if (!token) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirect=/profile');
        return;
      }

      // Load user profile
      const response = await authService.getUserProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Profile page error:', error);
      
      const authError = error as AuthError;
      
      // If unauthorized, redirect to login
      if (authError.statusCode === 401) {
        router.push('/auth/login?redirect=/profile');
        return;
      }
      
      setError(authError.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
          <div className="bg-white shadow sm:rounded-lg p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-300 rounded w-32"></div>
                  <div className="h-4 bg-gray-300 rounded w-48"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
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
                Error Loading Profile
              </h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <button
                  onClick={checkAuthAndLoadProfile}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div>
                  <a href="/" className="text-gray-400 hover:text-gray-500">
                    <svg className="flex-shrink-0 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="sr-only">Home</span>
                  </a>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">Profile</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Profile Component */}
        <UserProfile
          user={user || undefined}
          onEditProfile={() => router.push('/profile/edit')}
          onResendVerification={() => {
            // Could show a toast notification or redirect
            console.log('Resend verification requested');
          }}
          onError={(error) => {
            console.error('Profile error:', error);
            setError(error.message);
          }}
        />
      </div>
    </div>
  );
}
