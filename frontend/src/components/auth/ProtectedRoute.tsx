'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/auth.context';

// Default loading component
const DefaultLoadingComponent: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Checking authentication...</p>
    </div>
  </div>
);

// Props interface
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ComponentType;
  requireVerified?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  fallback: LoadingComponent = DefaultLoadingComponent,
  requireVerified = false
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, checkAuthStatus } = useAuth();
  
  // Component state
  const [isChecking, setIsChecking] = useState(true);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Store return URL for post-login redirect
  const storeReturnUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      // Store in both localStorage and sessionStorage for reliability
      localStorage.setItem('returnUrl', url);
      sessionStorage.setItem('returnUrl', url);
    }
  };

  // Get stored return URL
  const getReturnUrl = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('returnUrl') || sessionStorage.getItem('returnUrl');
    }
    return null;
  };

  // Clear stored return URL
  const clearReturnUrl = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('returnUrl');
      sessionStorage.removeItem('returnUrl');
    }
  };

  // Perform authentication check
  const performAuthCheck = async () => {
    try {
      setIsChecking(true);
      
      // If already loading from context, wait for it to complete
      if (isLoading) {
        return;
      }

      // If not authenticated, try to check auth status
      if (!isAuthenticated) {
        const isValid = await checkAuthStatus();
        if (!isValid) {
          // Store current URL for return after login
          storeReturnUrl(pathname);
          
          // Redirect to login with return URL in query params
          const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`;
          router.push(loginUrl);
          return;
        }
      }

      // Check if user verification is required
      if (requireVerified && user && user.status !== 'verified') {
        // Redirect to verification page or show verification required message
        router.push('/verify-email');
        return;
      }

      setAuthCheckComplete(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // On error, redirect to login
      storeReturnUrl(pathname);
      const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    } finally {
      setIsChecking(false);
    }
  };

  // Initial auth check on mount
  useEffect(() => {
    performAuthCheck();
  }, []);

  // Watch for authentication state changes
  useEffect(() => {
    if (!isLoading) {
      performAuthCheck();
    }
  }, [isAuthenticated, isLoading, user]);

  // Handle authentication state changes (user logs out while on protected page)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && authCheckComplete) {
      // User was authenticated but is no longer - redirect to login
      storeReturnUrl(pathname);
      const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    }
  }, [isAuthenticated, isLoading, authCheckComplete, pathname, redirectTo, router]);

  // Listen for storage events (user logs out in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' && e.newValue === null) {
        // Token was removed in another tab - redirect to login
        storeReturnUrl(pathname);
        const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`;
        router.push(loginUrl);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [pathname, redirectTo, router]);

  // Listen for custom auth events
  useEffect(() => {
    const handleAuthLogout = () => {
      // User logged out - redirect to login
      storeReturnUrl(pathname);
      const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    };

    const handleTokenExpired = () => {
      // Token expired - redirect to login
      storeReturnUrl(pathname);
      const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleAuthLogout);
      window.addEventListener('auth:token_expired', handleTokenExpired);
      
      return () => {
        window.removeEventListener('auth:logout', handleAuthLogout);
        window.removeEventListener('auth:token_expired', handleTokenExpired);
      };
    }
  }, [pathname, redirectTo, router]);

  // Show loading state while checking authentication
  if (isLoading || isChecking || !authCheckComplete) {
    return <LoadingComponent />;
  }

  // Show loading if not authenticated (while redirecting)
  if (!isAuthenticated) {
    return <LoadingComponent />;
  }

  // Check verification requirement
  if (requireVerified && user && user.status !== 'verified') {
    return <LoadingComponent />;
  }

  // User is authenticated and verified (if required) - render children
  return <>{children}</>;
};

// Higher-order component for easier usage
export const withProtectedRoute = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: React.ComponentType;
    requireVerified?: boolean;
  }
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withProtectedRoute(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Utility function to get and clear return URL (for use in login components)
export const useReturnUrl = () => {
  const getReturnUrl = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('returnUrl') || sessionStorage.getItem('returnUrl');
    }
    return null;
  };

  const clearReturnUrl = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('returnUrl');
      sessionStorage.removeItem('returnUrl');
    }
  };

  return { getReturnUrl, clearReturnUrl };
};

export default ProtectedRoute;
