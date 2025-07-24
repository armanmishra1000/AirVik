'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthError } from '../../types/auth.types';
import { authService } from '../../services/auth.service';
import { validatePassword, validateConfirmPassword } from '../../utils/validation';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';

interface ChangePasswordProps {
  onSuccess?: () => void;
  onError?: (error: AuthError) => void;
  className?: string;
}

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  [key: string]: string | undefined;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });
  
  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user types
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
    
    // Clear general error when user types
    if (generalError) {
      setGeneralError(null);
    }
    
    // Calculate password strength for new password
    if (field === 'newPassword') {
      calculatePasswordStrength(value);
    }
  };
  
  /**
   * Calculate password strength
   */
  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '' });
      return;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Normalize score to 0-4 range
    score = Math.min(4, score);
    
    const strengthMap = [
      { label: 'Very Weak', color: 'bg-red-500' },
      { label: 'Weak', color: 'bg-orange-500' },
      { label: 'Fair', color: 'bg-yellow-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-green-500' }
    ];
    
    setPasswordStrength({
      score,
      label: strengthMap[score].label,
      color: strengthMap[score].color
    });
  };
  
  /**
   * Handle field blur for validation
   */
  const handleFieldBlur = (field: keyof FormData) => {
    const error = validateField(field, formData[field]);
    
    if (error) {
      setFormErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }
  };
  
  /**
   * Validate a single field
   */
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'currentPassword':
        if (!value.trim()) return 'Current password is required';
        return undefined;
      
      case 'newPassword':
        if (!value.trim()) return 'New password is required';
        const passwordValidation = validatePassword(value);
        return passwordValidation.isValid ? undefined : passwordValidation.message;
      
      case 'confirmPassword':
        if (!value.trim()) return 'Please confirm your new password';
        const confirmValidation = validateConfirmPassword(value, formData.newPassword);
        return confirmValidation.isValid ? undefined : confirmValidation.message;
      
      default:
        return undefined;
    }
  };
  
  /**
   * Validate all fields
   */
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;
    
    // Validate current password
    const currentPasswordError = validateField('currentPassword', formData.currentPassword);
    if (currentPasswordError) {
      errors.currentPassword = currentPasswordError;
      isValid = false;
    }
    
    // Validate new password
    const newPasswordError = validateField('newPassword', formData.newPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
      isValid = false;
    }
    
    // Validate confirm password
    const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);
    if (confirmPasswordError) {
      errors.confirmPassword = confirmPasswordError;
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hide any previous success message
    setShowSuccess(false);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setGeneralError(null);
    
    try {
      await authService.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Show success message
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      const authError = error as AuthError;
      
      // Handle field-specific errors
      if (authError.fieldErrors) {
        setFormErrors(prev => ({
          ...prev,
          ...authError.fieldErrors
        }));
      } else {
        // Set general error message
        setGeneralError(authError.message || 'Failed to change password. Please try again.');
      }
      
      // Call error callback if provided
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
  const handleCancel = () => {
    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setGeneralError(null);
    setShowSuccess(false);
    
    // Navigate back to profile
    router.push('/profile');
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
        <Lock className="w-5 h-5 mr-2 text-blue-500" />
        Change Password
      </h2>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-green-800">Password Changed Successfully</h4>
            <p className="text-sm text-green-700">Your password has been updated successfully.</p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {generalError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-red-800">Error</h4>
            <p className="text-sm text-red-700">{generalError}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password Field */}
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              onBlur={() => handleFieldBlur('currentPassword')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your current password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {formErrors.currentPassword && (
            <p className="text-red-500 text-sm mt-1">{formErrors.currentPassword}</p>
          )}
        </div>
        
        {/* New Password Field */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              onBlur={() => handleFieldBlur('newPassword')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your new password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {formErrors.newPassword && (
            <p className="text-red-500 text-sm mt-1">{formErrors.newPassword}</p>
          )}
          
          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">Password Strength:</div>
                <div className="text-xs font-medium">{passwordStrength.label}</div>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${passwordStrength.color} transition-all duration-300`} 
                  style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                ></div>
              </div>
              
              {/* Password Requirements Checklist */}
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600 font-medium">Requirements:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className={`flex items-center ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.newPassword.length >= 8 ? '✓' : '○'} 8+ characters
                  </div>
                  <div className={`flex items-center ${/[A-Z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/[A-Z]/.test(formData.newPassword) ? '✓' : '○'} Uppercase
                  </div>
                  <div className={`flex items-center ${/[a-z]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/[a-z]/.test(formData.newPassword) ? '✓' : '○'} Lowercase
                  </div>
                  <div className={`flex items-center ${/[0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/[0-9]/.test(formData.newPassword) ? '✓' : '○'} Number
                  </div>
                  <div className={`flex items-center ${/[^A-Za-z0-9]/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-400'}`}>
                    {/[^A-Za-z0-9]/.test(formData.newPassword) ? '✓' : '○'} Special char
                  </div>
                  <div className={`flex items-center ${formData.newPassword !== formData.currentPassword ? 'text-green-600' : 'text-red-400'}`}>
                    {formData.newPassword !== formData.currentPassword ? '✓' : '✗'} Different
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={() => handleFieldBlur('confirmPassword')}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {formErrors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
          >
            {isSubmitting ? 'Changing Password...' : 'Change Password'}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
