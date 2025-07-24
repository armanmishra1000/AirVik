'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import RouteGuard from './RouteGuard';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard component for protecting routes based on user roles
 * This component checks if the current user has one of the allowed roles
 * If not, it redirects to the specified path or shows an unauthorized message
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  redirectTo = '/unauthorized',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Custom fallback for unauthorized users
  const unauthorizedFallback = fallback || (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex justify-center flex-col items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 text-red-500 mb-4" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-900">Unauthorized Access</h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              You don't have permission to access this page.
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Use RouteGuard for authentication check
  return (
    <RouteGuard requireAuth={true} fallback={isLoading ? undefined : unauthorizedFallback}>
      {isAuthenticated && user && allowedRoles.includes(user.role) ? (
        children
      ) : (
        // If user is authenticated but doesn't have the required role, redirect or show fallback
        React.useEffect(() => {
          if (!isLoading && isAuthenticated && user && !allowedRoles.includes(user.role)) {
            router.push(redirectTo);
          }
        }, [isLoading, isAuthenticated, user, router, redirectTo])
      )}
    </RouteGuard>
  );
};

// Specific role guard components for common use cases
export const AdminGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo 
}) => (
  <RoleGuard allowedRoles={[UserRole.ADMIN]} redirectTo={redirectTo}>
    {children}
  </RoleGuard>
);

export const ManagerGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo 
}) => (
  <RoleGuard allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]} redirectTo={redirectTo}>
    {children}
  </RoleGuard>
);

export const StaffGuard: React.FC<{ children: ReactNode; redirectTo?: string }> = ({ 
  children, 
  redirectTo 
}) => (
  <RoleGuard allowedRoles={[UserRole.MANAGER, UserRole.ADMIN]} redirectTo={redirectTo}>
    {children}
  </RoleGuard>
);

export default RoleGuard;
