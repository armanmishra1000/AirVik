'use client';

import React, { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  redirectTo,
  fallback,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      const redirect = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirect);
      return;
    }

    // Check verification requirement
    if (requireVerification && user && user.status !== 'verified') {
      router.push('/auth/resend-verification');
      return;
    }

    // If user is authenticated but trying to access auth pages, redirect to home
    if (isAuthenticated && isAuthPage(pathname)) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isLoading, user, requireAuth, requireVerification, router, pathname, redirectTo]);

  // Helper function to check if current path is an auth page
  const isAuthPage = (path: string): boolean => {
    const authPaths = [
      '/auth/login',
      '/register',
      '/register/success',
      '/auth/verify',
      '/auth/resend-verification',
    ];
    
    return authPaths.some(authPath => path.startsWith(authPath));
  };

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
                Loading...
              </p>
            </div>
          </div>
        </div>
      )
    );
  }

  // Check if user should be redirected (don't render children during redirect)
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (requireVerification && user && user.status !== 'verified') {
    return null; // Will redirect in useEffect
  }

  if (isAuthenticated && isAuthPage(pathname)) {
    return null; // Will redirect in useEffect
  }

  // Render children if all checks pass
  return <>{children}</>;
};

// Higher-order component for protecting pages
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    requireVerification?: boolean;
    redirectTo?: string;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <RouteGuard
        requireAuth={options.requireAuth}
        requireVerification={options.requireVerification}
        redirectTo={options.redirectTo}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specific guard components for common use cases
export const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth={true}>
    {children}
  </RouteGuard>
);

export const VerifiedGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth={true} requireVerification={true}>
    {children}
  </RouteGuard>
);

export const GuestGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth={false}>
    {children}
  </RouteGuard>
);

export default RouteGuard;
