'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthError, UserRole } from '../../types/auth.types';
import { authService } from '../../services/auth.service';
import { Calendar, Mail, Phone, Clock, User as UserIcon, Shield, Bell, Globe, Calendar as CalendarIcon } from 'lucide-react';

interface UserProfileProps {
  user?: User;
  onEditProfile?: () => void;
  onResendVerification?: () => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user: initialUser,
  onEditProfile,
  onResendVerification,
  onError,
  className = ''
}) => {
  const router = useRouter();
  
  // State management
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  /**
   * Load user profile if not provided
   */
  useEffect(() => {
    if (!initialUser) {
      loadUserProfile();
    }
  }, [initialUser]);

  /**
   * Load user profile from API
   */
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.getUserProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error('Failed to load profile');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      
      const authError = error as AuthError;
      const errorMessage = authError.message || 'Failed to load profile. Please try again.';
      setError(errorMessage);
      
      if (onError) {
        onError(authError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle edit profile button click
   */
  const handleEditProfile = useCallback(() => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      router.push('/profile/edit');
    }
  }, [onEditProfile, router]);

  /**
   * Handle resend verification
   */
  const handleResendVerification = async () => {
    if (!user?.email || isResendingVerification) return;

    setIsResendingVerification(true);

    try {
      await authService.resendVerificationEmail(user.email);
      
      if (onResendVerification) {
        onResendVerification();
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      
      const authError = error as AuthError;
      if (onError) {
        onError(authError);
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  /**
   * Get verification status badge color and text
   */
  const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Verified',
        icon: <CheckIcon className="w-4 h-4 mr-1" />
      };
    } else {
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        text: 'Unverified',
        icon: <AlertIcon className="w-4 h-4 mr-1" />
      };
    }
  };

  /**
   * Get active status badge color and text
   */
  const getActiveBadge = (isActive: boolean) => {
    if (isActive) {
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        text: 'Active',
        icon: <CheckIcon className="w-4 h-4 mr-1" />
      };
    } else {
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        text: 'Suspended',
        icon: <XIcon className="w-4 h-4 mr-1" />
      };
    }
  };

  /**
   * Get role badge color and text
   */
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          text: 'Admin',
          icon: <Shield className="w-4 h-4 mr-1" />
        };
      case UserRole.MANAGER:
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          text: 'Manager',
          icon: <Shield className="w-4 h-4 mr-1" />
        };
      case UserRole.CUSTOMER:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Customer',
          icon: <UserIcon className="w-4 h-4 mr-1" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Unknown',
          icon: <UserIcon className="w-4 h-4 mr-1" />
        };
    }
  };

  // SVG Icons as components for reuse
  const CheckIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const AlertIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );

  const XIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
    </svg>
  );

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
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
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Profile</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUserProfile}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  /**
   * Render no user state
   */
  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600">No user profile available</p>
        </div>
      </div>
    );
  }

  const verificationBadge = getVerificationBadge(user.isEmailVerified);
  const activeBadge = getActiveBadge(user.isActive);
  const roleBadge = getRoleBadge(user.role);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Header with Avatar and Basic Info */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={`${user.firstName} ${user.lastName}`} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getUserInitials(user.firstName, user.lastName)
            )}
          </div>
          
          {/* User Info */}
          <div className="text-white">
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-blue-100 flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {user.email}
            </p>
            
            {/* Badges */}
            <div className="mt-2 flex flex-wrap gap-2">
              {/* Role Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge.color}`}>
                {roleBadge.icon}
                {roleBadge.text}
              </span>
              
              {/* Verification Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${verificationBadge.color}`}>
                {verificationBadge.icon}
                {verificationBadge.text}
              </span>
              
              {/* Active Badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeBadge.color}`}>
                {activeBadge.icon}
                {activeBadge.text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-6 py-6">
        {/* Verification Alert for Unverified Users */}
        {!user.isEmailVerified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Email Verification Required
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Please verify your email address to access all features and secure your account.
                </p>
                <button
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                  className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
              Basic Information
            </h3>
            
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">First Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.firstName}</dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.lastName}</dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Mail className="w-4 h-4 mr-1 text-blue-500" />
                  Email Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-1 text-blue-500" />
                  Phone Number
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.phone || 'Not provided'}
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1 text-blue-500" />
                  Date of Birth
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Not provided'}
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Shield className="w-4 h-4 mr-1 text-blue-500" />
                  Account Role
                </dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleBadge.color}`}>
                    {roleBadge.icon}
                    {roleBadge.text}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-500" />
              Account Status
            </h3>
            
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Email Verification</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${verificationBadge.color}`}>
                    {verificationBadge.icon}
                    {verificationBadge.text}
                  </span>
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${activeBadge.color}`}>
                    {activeBadge.icon}
                    {activeBadge.text}
                  </span>
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-blue-500" />
                  Member Since
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-blue-500" />
                  Last Login
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not available'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-blue-500" />
              Preferences
            </h3>
            
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Newsletter</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.preferences?.newsletter ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.preferences?.newsletter ? 'Subscribed' : 'Not Subscribed'}
                  </span>
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500">Notifications</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.preferences?.notifications ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user.preferences?.notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </dd>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-md">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Globe className="w-4 h-4 mr-1 text-blue-500" />
                  Language
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.preferences?.language || 'English'}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Registration Metadata */}
          {user.metadata && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
                Registration Details
              </h3>
              
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {user.metadata.registrationIP && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Registration IP</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
                      {user.metadata.registrationIP}
                    </dd>
                  </div>
                )}
                
                {user.metadata.source && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <dt className="text-sm font-medium text-gray-500">Registration Source</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {user.metadata.source}
                    </dd>
                  </div>
                )}
                
                {user.metadata.userAgent && (
                  <div className="p-3 bg-gray-50 rounded-md col-span-1 sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">User Agent</dt>
                    <dd className="mt-1 text-xs text-gray-900 font-mono break-all">
                      {user.metadata.userAgent}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleEditProfile}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Edit Profile
          </button>
          
          {!user.isEmailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={isResendingVerification}
              className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors duration-200"
            >
              {isResendingVerification ? 'Sending...' : 'Verify Email'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
