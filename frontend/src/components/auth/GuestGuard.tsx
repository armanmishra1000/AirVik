'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface GuestGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
  loadingMessage?: string;
  preserveQuery?: boolean;
}

/**
 * GuestGuard component for protecting routes that should only be accessible to unauthenticated users
 * For example, login and registration pages should redirect authenticated users elsewhere
 */
const GuestGuard: React.FC<GuestGuardProps> = ({
  children,
  redirectTo = '/',
  fallback,
  loadingMessage = 'Checking authentication status...',
  preserveQuery = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  // Get redirect URL from query parameter if available
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      
      // If we have a redirect param and want to preserve query params
      if (redirectParam && preserveQuery) {
        // Extract query params from current URL
        const currentQuery = window.location.search;
        if (currentQuery && !redirectParam.includes('?')) {
          // Remove the redirect param from the query
          const filteredParams = new URLSearchParams(currentQuery);
          filteredParams.delete('redirect');
          
          // Only append if we have remaining params
          if ([...filteredParams.entries()].length > 0) {
            return `${redirectParam}?${filteredParams.toString()}`;
          }
        }
      }
      
      return redirectParam || redirectTo;
    }
    return redirectTo;
  };

  // Track if we've started a redirect
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // If authentication is still loading, wait
    if (isLoading) return;

    // If user is authenticated, redirect them away from guest-only pages
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      const targetUrl = getRedirectUrl();
      console.log(`GuestGuard: Redirecting authenticated user to ${targetUrl}`);
      router.replace(targetUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, isRedirecting]);

  // Show loading state
  if (isLoading || isRedirecting) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                {isRedirecting ? 'Redirecting...' : loadingMessage}
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
export const LoginGuard: React.FC<{ 
  children: ReactNode; 
  redirectTo?: string;
  preserveQuery?: boolean;
  loadingMessage?: string;
}> = ({ 
  children, 
  redirectTo,
  preserveQuery = true,
  loadingMessage
}) => (
  <GuestGuard 
    redirectTo={redirectTo}
    preserveQuery={preserveQuery}
    loadingMessage={loadingMessage || 'Checking login status...'}
  >
    {children}
  </GuestGuard>
);

export const RegisterGuard: React.FC<{ 
  children: ReactNode; 
  redirectTo?: string;
  preserveQuery?: boolean;
  loadingMessage?: string;
}> = ({ 
  children, 
  redirectTo,
  preserveQuery = true,
  loadingMessage
}) => (
  <GuestGuard 
    redirectTo={redirectTo}
    preserveQuery={preserveQuery}
    loadingMessage={loadingMessage || 'Checking registration status...'}
  >
    {children}
  </GuestGuard>
);

// Additional specialized guard for password reset and other auth pages
export const AuthPageGuard: React.FC<{ 
  children: ReactNode; 
  redirectTo?: string;
  preserveQuery?: boolean;
  loadingMessage?: string;
}> = ({ 
  children, 
  redirectTo,
  preserveQuery = true,
  loadingMessage
}) => (
  <GuestGuard 
    redirectTo={redirectTo}
    preserveQuery={preserveQuery}
    loadingMessage={loadingMessage}
  >
    {children}
  </GuestGuard>
);

export default GuestGuard;
