'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface GuestGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * GuestGuard component for protecting routes that should only be accessible to unauthenticated users
 * For example, login and registration pages should redirect authenticated users elsewhere
 */
const GuestGuard: React.FC<GuestGuardProps> = ({
  children,
  redirectTo = '/',
  fallback,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Get redirect URL from query parameter if available
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      return redirectParam || redirectTo;
    }
    return redirectTo;
  };

  useEffect(() => {
    // If authentication is still loading, wait
    if (isLoading) return;

    // If user is authenticated, redirect them away from guest-only pages
    if (isAuthenticated) {
      router.replace(getRedirectUrl());
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                Checking authentication status...
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  // If user is authenticated, don't render children (will redirect in useEffect)
  if (isAuthenticated) {
    return null;
  }

  // If user is not authenticated, render children
  return <>{children}</>;
};

// Specific guest guard components for common use cases
export const LoginGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo 
}) => (
  <GuestGuard redirectTo={redirectTo}>
    {children}
  </GuestGuard>
);

export const RegisterGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo 
}) => (
  <GuestGuard redirectTo={redirectTo}>
    {children}
  </GuestGuard>
);

export default GuestGuard;
