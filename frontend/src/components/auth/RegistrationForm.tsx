'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  RegisterRequest, 
  RegistrationFormState, 
  PasswordValidation,
  RegistrationFormProps,
  AuthError,
  User 
} from '../../types/auth.types';
import { authService } from '../../services/auth.service';
import { validatePassword, validateEmail, validateName, validatePhoneNumber } from '../../utils/validation';
import { Eye, EyeOff, Mail, Phone, Lock, CheckCircle, AlertCircle, Loader2, User as UserIcon } from 'lucide-react';

const RegistrationForm: React.FC<RegistrationFormProps> = ({ 
  onSuccess, 
  onError, 
  className = '' 
}) => {
  const router = useRouter();
  
  // Form state management
  const [formState, setFormState] = useState<RegistrationFormState>({
    isLoading: false,
    isSubmitting: false,
    error: null,
    success: null,
    data: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: ''
    },
    confirmPassword: '',
    agreedToTerms: false
  });

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle input field changes
   */
  const handleInputChange = useCallback((field: keyof RegisterRequest | 'confirmPassword', value: string) => {
    setFormState(prev => ({
      ...prev,
      data: field === 'confirmPassword' ? prev.data : { ...prev.data, [field]: value },
      confirmPassword: field === 'confirmPassword' ? value : prev.confirmPassword,
      error: null // Clear form error when user types
    }));

    // Clear field-specific error
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time password validation
    if (field === 'password') {
      // TODO: Implement password strength validation
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  }, [fieldErrors]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // TODO: Validate all fields before submission
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // TODO: Call registration API
      const result = await authService.registerUser(formState.data);
      
      // TODO: Handle successful registration
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        success: 'Registration successful! Please check your email for verification instructions.' 
      }));

      // TODO: Redirect to success page
      setTimeout(() => {
        router.push('/register/success');
      }, 2000);

      // Call success callback if provided
      if (onSuccess && result.data) {
        // Extract user from the response data
        const user = (result.data as any).user || result.data;
        onSuccess(user as User);
      }

    } catch (error) {
      // Handle registration error silently - UI will show user-friendly message
      
      const authError = error as AuthError;
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: authError.message || 'Registration failed. Please try again.' 
      }));

      // Handle field-specific errors
      if (authError.field) {
        setFieldErrors({ [authError.field]: authError.message });
      }

      // Call error callback if provided
      if (onError) {
        onError(authError);
      }
    }
  };

  /**
   * Validate all form fields
   */
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // TODO: Email validation
    if (!validateEmail(formState.data.email).isValid) {
      errors.email = 'Please enter a valid email address';
    }

    // TODO: Password validation
    if (!passwordValidation?.isValid) {
      errors.password = passwordValidation?.message || 'Password does not meet requirements';
    }

    // TODO: Confirm password validation
    if (formState.data.password !== formState.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // TODO: Name validations
    if (!validateName(formState.data.firstName).isValid) {
      errors.firstName = 'First name must be 2-50 characters and contain only letters';
    }

    if (!validateName(formState.data.lastName).isValid) {
      errors.lastName = 'Last name must be 2-50 characters and contain only letters';
    }

    // TODO: Terms agreement validation
    if (!formState.agreedToTerms) {
      errors.terms = 'You must agree to the terms and conditions';
    }

    return errors;
  };

  /**
   * Get password strength indicator color
   */
  const getPasswordStrengthColor = () => {
    if (!passwordValidation) return 'bg-gray-200';
    switch (passwordValidation.strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className={`max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <UserIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
        <p className="text-gray-600">Join AirVik and start your journey</p>
      </div>

      {/* Alert Messages */}
      {formState.error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
            <p className="text-red-700 text-sm font-medium">{formState.error}</p>
          </div>
        </div>
      )}

      {formState.success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <p className="text-green-700 text-sm font-medium">{formState.success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              value={formState.data.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full text-black pl-10 pr-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.email 
                  ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
              }`}
              placeholder="Enter your email address"
              required
              disabled={formState.isSubmitting}
            />
          </div>
          {fieldErrors.email && (
            <div className="flex items-center mt-1">
              <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
              <p className="text-red-500 text-sm">{fieldErrors.email}</p>
            </div>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
              First Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                value={formState.data.firstName || ''}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full text-black pl-10 pr-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.firstName 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
                }`}
                placeholder="First name"
                required
                disabled={formState.isSubmitting}
              />
            </div>
            {fieldErrors.firstName && (
              <div className="flex items-center mt-1">
                <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                <p className="text-red-500 text-sm">{fieldErrors.firstName}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
              Last Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                value={formState.data.lastName || ''}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full text-black pl-10 pr-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.lastName 
                    ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
                }`}
                placeholder="Last name"
                required
                disabled={formState.isSubmitting}
              />
            </div>
            {fieldErrors.lastName && (
              <div className="flex items-center mt-1">
                <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                <p className="text-red-500 text-sm">{fieldErrors.lastName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Phone Number Field (Optional) */}
        <div className="space-y-2">
          <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700">
            Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="phoneNumber"
              value={formState.data.phoneNumber || ''}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className={`w-full text-black pl-10 pr-4 py-3 border-2 rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                fieldErrors.phoneNumber 
                  ? 'border-red-300 bg-red-50 focus:ring-red-500' 
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 focus:bg-white'
              }`}
              placeholder="+1 (555) 123-4567"
              disabled={formState.isSubmitting}
            />
          </div>
          {fieldErrors.phoneNumber && (
            <div className="flex items-center mt-1">
              <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
              <p className="text-red-500 text-sm">{fieldErrors.phoneNumber}</p>
            </div>
          )}
        </div>

        {/* Password Field with Strength Indicator */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formState.data.password || ''}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`text-black w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                fieldErrors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Create a strong password"
              required
              disabled={formState.isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {/* TODO: Add eye icon for password visibility toggle */}
              {showPassword ? <EyeOff /> : <Eye /> }
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {formState.data.password && passwordValidation && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordValidation.score + 1) * 20}%` }}
                  />
                </div>
                <span className="text-sm font-medium capitalize">{passwordValidation.strength}</span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                {/* TODO: Show detailed password requirements */}
                Requirements: 8+ chars, uppercase, lowercase, number
              </div>
            </div>
          )}
          
          {fieldErrors.password && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="confirmPassword"
            value={formState.confirmPassword || ''}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`text-black w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm your password"
            required
            disabled={formState.isSubmitting}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="agreedToTerms"
            checked={formState.agreedToTerms}
            onChange={(e) => setFormState(prev => ({ ...prev, agreedToTerms: e.target.checked }))}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            required
            disabled={formState.isSubmitting}
          />
          <label htmlFor="agreedToTerms" className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800">
              Privacy Policy
            </a>
          </label>
        </div>
        {fieldErrors.terms && (
          <p className="text-red-500 text-sm">{fieldErrors.terms}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={formState.isSubmitting || !formState.agreedToTerms}
          className={`text-black w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${formState.isSubmitting || !formState.agreedToTerms
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition-colors duration-200`}
        >
          {formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;

// TODO: Add form auto-save to localStorage
// TODO: Add social login integration (Google, Facebook)
// TODO: Add accessibility improvements (ARIA labels, keyboard navigation)
// TODO: Add form analytics and conversion tracking  
// TODO: Add progressive enhancement for JavaScript disabled
// TODO: Add form validation debouncing for better UX
// TODO: Add password strength suggestions
// TODO: Add email domain validation
// TODO: Add CAPTCHA integration for bot protection
// TODO: Add form field masking for phone numbers
