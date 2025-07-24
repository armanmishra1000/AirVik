'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '../../types/auth.types';
 
interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireVerification?: boolean;
  redirectTo?: string;
  fallback?: ReactNode;
  permission?: Permission;
  requiredRole?: UserRole;
  showVerificationPrompt?: boolean;
  loadingMessage?: string;
  unauthorizedMessage?: string;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requireVerification = false,
  redirectTo,
  fallback,
  permission,
  requiredRole,
  showVerificationPrompt = false,
  loadingMessage,
  unauthorizedMessage,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Permission checking function
  const hasPermission = (perm: Permission): boolean => {
    if (!user) return false;
    
    switch (perm) {
      case Permission.AUTHENTICATED:
        return isAuthenticated;
      case Permission.VERIFIED:
        return isAuthenticated && user.isEmailVerified;
      case Permission.BOOKING:
        return isAuthenticated && user.isEmailVerified;
      case Permission.PROFILE:
        return isAuthenticated;
      case Permission.ADMIN:
        return isAuthenticated && user.role === UserRole.ADMIN;
      default:
        return false;
    }
  };

  // Role checking function
  const hasRole = (role: UserRole): boolean => {
    if (!user || !isAuthenticated) return false;
    
    // Admin has access to all roles
    if (user.role === UserRole.ADMIN) return true;
    
    // Manager has access to customer role
    if (user.role === UserRole.MANAGER && role === UserRole.CUSTOMER) return true;
    
    // Exact role match
    return user.role === role;
  };

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load
    
    const checkAccess = async () => {
      setIsCheckingAuth(true);
      setAuthError(null);
      
      try {
        // Check authentication requirement
        if (requireAuth && !isAuthenticated) {
          const redirect = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`;
          router.push(redirect);
          return;
        }
        
        // Check role requirement if specified
        if (requiredRole && !hasRole(requiredRole)) {
          setAuthError(unauthorizedMessage || `Access denied. ${requiredRole} role required.`);
          
          // Redirect based on role requirement
          if (requiredRole === UserRole.ADMIN) {
            router.push('/unauthorized?reason=admin_required');
          } else if (requiredRole === UserRole.MANAGER) {
            router.push('/unauthorized?reason=manager_required');
          } else {
            router.push('/unauthorized?reason=insufficient_role');
          }
          return;
        }
        
        // Check permission requirement if specified
        if (permission && !hasPermission(permission)) {
          // For verification permission, handle special case
          if (permission === Permission.VERIFIED && showVerificationPrompt && user) {
            router.push(`/auth/verification-prompt?returnUrl=${encodeURIComponent(pathname)}`);
            return;
          }
          
          // For admin permission, redirect to unauthorized page
          if (permission === Permission.ADMIN) {
            setAuthError(unauthorizedMessage || 'Admin access required.');
            router.push('/unauthorized?reason=admin_required');
            return;
          }
          
          // For booking permission (requires verification)
          if (permission === Permission.BOOKING && user && !user.isEmailVerified) {
            if (showVerificationPrompt) {
              router.push(`/auth/verification-prompt?returnUrl=${encodeURIComponent(pathname)}&feature=booking`);
            } else {
              router.push('/auth/resend-verification?reason=booking_required');
            }
            return;
          }
          
          // For other permissions, redirect to login
          const redirect = redirectTo || `/auth/login?redirect=${encodeURIComponent(pathname)}`;
          router.push(redirect);
          return;
        }
        
        // Check verification requirement (legacy support)
        if (requireVerification && user && !user.isEmailVerified) {
          if (showVerificationPrompt) {
            router.push(`/auth/verification-prompt?returnUrl=${encodeURIComponent(pathname)}`);
          } else {
            router.push('/auth/resend-verification');
          }
          return;
        }
        
        // If user is authenticated but trying to access auth pages, redirect to home
        if (isAuthenticated && isAuthPage(pathname)) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Route guard error:', error);
        setAuthError('An error occurred while checking permissions.');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAccess();
  }, [isAuthenticated, isLoading, user, requireAuth, requireVerification, permission, requiredRole, router, pathname, redirectTo, showVerificationPrompt, unauthorizedMessage]);

  // Helper function to check if current path is an auth page
  const isAuthPage = (path: string): boolean => {
    const authPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/register/success',
      '/auth/verify',
      '/auth/resend-verification',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    
    return authPaths.some(authPath => path.startsWith(authPath));
  };

  // Show loading state
  if (isLoading || isCheckingAuth) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">
                {loadingMessage || (isLoading ? 'Loading authentication...' : 'Checking permissions...')}
              </p>
              {authError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{authError}</p>
                </div>
              )}
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

  if (requiredRole && !hasRole(requiredRole)) {
    return null; // Will redirect in useEffect
  }

  if (permission && !hasPermission(permission)) {
    return null; // Will redirect in useEffect
  }

  if (requireVerification && user && !user.isEmailVerified) {
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
    permission?: Permission;
    requiredRole?: UserRole;
    redirectTo?: string;
    showVerificationPrompt?: boolean;
    loadingMessage?: string;
    unauthorizedMessage?: string;
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <RouteGuard
        requireAuth={options.requireAuth}
        requireVerification={options.requireVerification}
        permission={options.permission}
        requiredRole={options.requiredRole}
        redirectTo={options.redirectTo}
        showVerificationPrompt={options.showVerificationPrompt}
        loadingMessage={options.loadingMessage}
        unauthorizedMessage={options.unauthorizedMessage}
      >
        <Component {...props} />
      </RouteGuard>
    );
  };

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specific guard components for common use cases
export const AuthGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ children, redirectTo }) => (
  <RouteGuard requireAuth={true} redirectTo={redirectTo}>
    {children}
  </RouteGuard>
);

export const VerifiedGuard: React.FC<{ children: ReactNode; redirectTo?: string; showPrompt?: boolean }> = ({ 
  children, 
  redirectTo,
  showPrompt = false 
}) => (
  <RouteGuard 
    requireAuth={true} 
    permission={Permission.VERIFIED}
    redirectTo={redirectTo}
    showVerificationPrompt={showPrompt}
  >
    {children}
  </RouteGuard>
);

export const GuestGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ children, redirectTo }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo || '/');
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);
  
  if (isLoading) {
    return (
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
    );
  }
  
  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return <>{children}</>;
};

export const BookingGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ children, redirectTo }) => (
  <RouteGuard 
    requireAuth={true} 
    permission={Permission.BOOKING}
    redirectTo={redirectTo}
    showVerificationPrompt={true}
  >
    {children}
  </RouteGuard>
);

export default RouteGuard;
