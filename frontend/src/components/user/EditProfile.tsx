'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, UpdateProfileRequest, AuthError } from '../../types/auth.types';
import { authService } from '../../services/auth.service';
import { validateName, validatePhoneNumber } from '../../utils/validation';

interface EditProfileProps {
  user?: User;
  onSave?: (updatedUser: User) => void;
  onCancel?: () => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

const EditProfile: React.FC<EditProfileProps> = ({
  user: initialUser,
  onSave,
  onCancel,
  onError,
  className = ''
}) => {
  const router = useRouter();
  
  // State management
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isLoadingUser, setIsLoadingUser] = useState(!initialUser);
  const [formData, setFormData] = useState<FormData>({
    firstName: initialUser?.firstName || '',
    lastName: initialUser?.lastName || '',
    phoneNumber: initialUser?.phoneNumber || ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Load user profile if not provided
   */
  useEffect(() => {
    if (!initialUser) {
      loadUserProfile();
    }
  }, [initialUser]);

  /**
   * Update form data when user changes
   */
  useEffect(() => {
    if (user) {
      const newFormData = {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || ''
      };
      setFormData(newFormData);
      setHasChanges(false);
    }
  }, [user]);

  /**
   * Check for changes in form data
   */
  useEffect(() => {
    if (user) {
      const hasFormChanges = 
        formData.firstName !== user.firstName ||
        formData.lastName !== user.lastName ||
        formData.phoneNumber !== (user.phoneNumber || '');
      setHasChanges(hasFormChanges);
    }
  }, [formData, user]);

  /**
   * Load user profile from API
   */
  const loadUserProfile = async () => {
    try {
      setIsLoadingUser(true);
      setErrorMessage(null);
      
      const response = await authService.getUserProfile();
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Load profile error:', error);
      
      const authError = error as AuthError;
      
      // Handle specific error cases
      if (authError.statusCode === 401) {
        // Token expired or invalid - redirect to login
        setErrorMessage('Your session has expired. Please log in again.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else if (authError.statusCode === 403) {
        setErrorMessage('Access denied. Please check your permissions.');
      } else if (authError.isNetworkError) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage(authError.message || 'Failed to load profile. Please try again.');
      }
      
      if (onError) {
        onError(authError);
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  /**
   * Handle input field changes
   */
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear messages
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [formErrors]);

  /**
   * Validate individual field
   */
  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        const nameValidation = validateName(value);
        return nameValidation.isValid ? undefined : nameValidation.message;
      
      case 'phoneNumber':
        if (value.trim() === '') return undefined; // Phone is optional
        const phoneValidation = validatePhoneNumber(value);
        return phoneValidation.isValid ? undefined : phoneValidation.message;
      
      default:
        return undefined;
    }
  };

  /**
   * Validate all form fields
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    // Validate first name
    const firstNameError = validateField('firstName', formData.firstName);
    if (firstNameError) errors.firstName = firstNameError;
    
    // Validate last name
    const lastNameError = validateField('lastName', formData.lastName);
    if (lastNameError) errors.lastName = lastNameError;
    
    // Validate phone number
    const phoneError = validateField('phoneNumber', formData.phoneNumber);
    if (phoneError) errors.phoneNumber = phoneError;
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setFormErrors({});

    try {
      const updateData: UpdateProfileRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim() || undefined
      };

      const response = await authService.updateUserProfile(updateData);
      
      if (response.success && response.data) {
        setUser(response.data);
        setSuccessMessage('Profile updated successfully!');
        setHasChanges(false);
        
        if (onSave) {
          onSave(response.data);
        }
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      const authError = error as AuthError;
      
      // Handle specific error cases
      if (authError.statusCode === 401) {
        // Token expired or invalid - redirect to login
        setErrorMessage('Your session has expired. Please log in again.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else if (authError.statusCode === 400) {
        // Validation errors from backend
        if (authError.field) {
          // Field-specific validation error
          setFormErrors({ [authError.field]: authError.message });
          setErrorMessage('Please correct the highlighted fields.');
        } else {
          setErrorMessage(authError.message || 'Please check your input and try again.');
        }
      } else if (authError.statusCode === 403) {
        setErrorMessage('Access denied. You do not have permission to update this profile.');
      } else if (authError.isNetworkError) {
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setErrorMessage(authError.message || 'Failed to update profile. Please try again.');
      }
      
      if (onError) {
        onError(authError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = useCallback(() => {
    // Reset form to original values if there are unsaved changes
    if (hasChanges && user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || ''
      });
      setFormErrors({});
      setSuccessMessage(null);
      setErrorMessage(null);
      setHasChanges(false);
    }
    
    if (onCancel) {
      onCancel();
    } else {
      router.push('/profile');
    }
  }, [onCancel, router, hasChanges, user]);

  /**
   * Handle field blur for validation
   */
  const handleFieldBlur = (field: keyof FormData) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  /**
   * Render loading state
   */
  if (isLoadingUser) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
            <div className="h-10 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (!user && errorMessage) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Profile</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
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

  if (!user) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600">No user profile available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <p className="text-gray-600 mt-1">Update your personal information</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field (Read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              onBlur={() => handleFieldBlur('firstName')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your first name"
              required
              disabled={isSubmitting}
            />
            {formErrors.firstName && (
              <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              onBlur={() => handleFieldBlur('lastName')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your last name"
              required
              disabled={isSubmitting}
            />
            {formErrors.lastName && (
              <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
            )}
          </div>
        </div>

        {/* Phone Number Field */}
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            onBlur={() => handleFieldBlur('phoneNumber')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number (optional)"
            disabled={isSubmitting}
          />
          {formErrors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Phone number is optional</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting || !hasChanges}
            className={`flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${isSubmitting || !hasChanges
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              } transition-colors duration-200`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Don't forget to save your updates!
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditProfile;
