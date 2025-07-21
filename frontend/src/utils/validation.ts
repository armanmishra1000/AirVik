import { PasswordValidation, ValidationResult } from '../types/auth.types';

/**
 * Email validation utility
 */
export const validateEmail = (email: string): ValidationResult => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return { isValid: false, message: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
        return { isValid: false, message: 'Please enter a valid email address' };
    }

    if (email.length > 254) {
        return { isValid: false, message: 'Email address is too long' };
    }

    return { isValid: true, message: 'Valid email address' };
};

/**
 * Password validation with strength checking
 */
export const validatePassword = (password: string): PasswordValidation => {
    if (!password) {
        return {
            isValid: false,
            strength: 'weak',
            score: 0,
            message: 'Password is required',
            feedback: {
                hasMinLength: false,
                hasUppercase: false,
                hasLowercase: false,
                hasNumber: false,
                hasSpecialChar: false
            }
        };
    }

    const feedback = {
        hasMinLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(feedback).filter(Boolean).length;

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    let message = '';

    if (score <= 2) {
        strength = 'weak';
        message = 'Password is too weak';
    } else if (score === 3 || score === 4) {
        strength = 'medium';
        message = 'Password strength is medium';
    } else {
        strength = 'strong';
        message = 'Password strength is strong';
    }

    const isValid = feedback.hasMinLength &&
        feedback.hasUppercase &&
        feedback.hasLowercase &&
        feedback.hasNumber;

    return {
        isValid,
        strength,
        score,
        message,
        feedback
    };
};

/**
 * Name validation utility
 */
export const validateName = (name: string): ValidationResult => {
    if (!name) {
        return { isValid: false, message: 'Name is required' };
    }

    if (name.length < 2) {
        return { isValid: false, message: 'Name must be at least 2 characters long' };
    }

    if (name.length > 50) {
        return { isValid: false, message: 'Name must be less than 50 characters' };
    }

    // Allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(name)) {
        return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { isValid: true, message: 'Valid name' };
};

/**
 * Phone number validation utility
 */
export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
    // Phone number is optional
    if (!phoneNumber || phoneNumber.trim() === '') {
        return { isValid: true, message: 'Phone number is optional' };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // Check for valid length (10-15 digits)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return { isValid: false, message: 'Phone number must be 10-15 digits long' };
    }

    // Basic phone number format validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(digitsOnly)) {
        return { isValid: false, message: 'Please enter a valid phone number' };
    }

    return { isValid: true, message: 'Valid phone number' };
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
    if (!confirmPassword) {
        return { isValid: false, message: 'Please confirm your password' };
    }

    if (password !== confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }

    return { isValid: true, message: 'Passwords match' };
};

/**
 * Terms agreement validation
 */
export const validateTermsAgreement = (agreed: boolean): ValidationResult => {
    if (!agreed) {
        return { isValid: false, message: 'You must agree to the terms and conditions' };
    }

    return { isValid: true, message: 'Terms accepted' };
};

/**
 * Validate entire registration form
 */
export const validateRegistrationForm = (formData: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    agreedToTerms: boolean;
}): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
        errors.email = emailValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
        errors.password = passwordValidation.message;
    }

    // Validate confirm password
    const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!confirmPasswordValidation.isValid) {
        errors.confirmPassword = confirmPasswordValidation.message;
    }

    // Validate first name
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
        errors.firstName = firstNameValidation.message;
    }

    // Validate last name
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
        errors.lastName = lastNameValidation.message;
    }

    // Validate phone number (optional)
    if (formData.phoneNumber) {
        const phoneValidation = validatePhoneNumber(formData.phoneNumber);
        if (!phoneValidation.isValid) {
            errors.phoneNumber = phoneValidation.message;
        }
    }

    // Validate terms agreement
    const termsValidation = validateTermsAgreement(formData.agreedToTerms);
    if (!termsValidation.isValid) {
        errors.terms = termsValidation.message;
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};



/**
 * Generic required field validation
 */
export const validateRequired = (value: any, fieldName: string = 'Field'): ValidationResult => {
    // Check for null, undefined, empty string, or whitespace-only string
    if (value === null || value === undefined) {
        return { isValid: false, message: `${fieldName} is required` };
    }

    if (typeof value === 'string' && value.trim() === '') {
        return { isValid: false, message: `${fieldName} is required` };
    }

    if (Array.isArray(value) && value.length === 0) {
        return { isValid: false, message: `${fieldName} is required` };
    }

    if (typeof value === 'object' && Object.keys(value).length === 0) {
        return { isValid: false, message: `${fieldName} is required` };
    }

    return { isValid: true, message: `${fieldName} is valid` };
};

/**
 * Debounced validation utility for async validation
 */
export const createDebouncedValidator = (
    validator: (value: any) => ValidationResult | Promise<ValidationResult>,
    delay: number = 300
) => {
    let timeoutId: NodeJS.Timeout;

    return (value: any): Promise<ValidationResult> => {
        return new Promise((resolve) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                try {
                    const result = await validator(value);
                    resolve(result);
                } catch (error) {
                    resolve({
                        isValid: false,
                        message: 'Validation error occurred'
                    });
                }
            }, delay);
        });
    };
};

/**
 * Form field validation helper
 */
export const validateFormField = (
    fieldName: string,
    value: any,
    validators: Array<(value: any) => ValidationResult>
): ValidationResult => {
    for (const validator of validators) {
        const result = validator(value);
        if (!result.isValid) {
            return result;
        }
    }

    return { isValid: true, message: `${fieldName} is valid` };
};

/**
 * Batch validation for multiple fields
 */
export const validateFields = (
    fields: Record<string, { value: any; validators: Array<(value: any) => ValidationResult> }>
): { isValid: boolean; errors: Record<string, string>; results: Record<string, ValidationResult> } => {
    const errors: Record<string, string> = {};
    const results: Record<string, ValidationResult> = {};

    for (const [fieldName, { value, validators }] of Object.entries(fields)) {
        const result = validateFormField(fieldName, value, validators);
        results[fieldName] = result;

        if (!result.isValid) {
            errors[fieldName] = result.message;
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        results
    };
};

/**
 * Password strength scoring algorithm
 */
export const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;

    let score = 0;

    // Length scoring
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety scoring
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Pattern penalties
    if (/(..).*\1/.test(password)) score -= 1; // Repeated patterns
    if (/^\d+$/.test(password)) score -= 2; // Only numbers
    if (/^[a-zA-Z]+$/.test(password)) score -= 1; // Only letters

    // Common password penalties
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
        score -= 3;
    }

    return Math.max(0, Math.min(10, score)); // Clamp between 0-10
};

/**
 * Error message standardization
 */
export const standardizeErrorMessage = (field: string, error: string): string => {
    const fieldDisplayName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');

    // Common error patterns
    const patterns = {
        required: `${fieldDisplayName} is required`,
        invalid: `Please enter a valid ${fieldDisplayName.toLowerCase()}`,
        tooShort: `${fieldDisplayName} is too short`,
        tooLong: `${fieldDisplayName} is too long`,
        mismatch: `${fieldDisplayName} does not match`
    };

    // Try to match common patterns
    for (const [pattern, message] of Object.entries(patterns)) {
        if (error.toLowerCase().includes(pattern)) {
            return message;
        }
    }

    return error;
};

/**
 * Validation test utilities for comprehensive testing
 */
export const validationTests = {
    email: {
        valid: [
            'test@example.com',
            'user.name@domain.co.uk',
            'user+tag@example.org',
            'firstname-lastname@example.com'
        ],
        invalid: [
            '',
            'invalid-email',
            '@example.com',
            'test@',
            'test..test@example.com',
            'test@example',
            'a'.repeat(255) + '@example.com'
        ]
    },
    password: {
        weak: [
            '',
            '123',
            'password',
            'abc123',
            'Password'
        ],
        medium: [
            'Password1',
            'MyPass123',
            'Test1234'
        ],
        strong: [
            'MyStr0ng!Pass',
            'C0mplex@Password123',
            'Secure#Pass2024!'
        ]
    },
    name: {
        valid: [
            'John',
            'Mary Jane',
            "O'Connor",
            'Jean-Pierre',
            '李小明'
        ],
        invalid: [
            '',
            'A',
            'A'.repeat(51),
            'John123',
            'Test@Name'
        ]
    },
    phone: {
        valid: [
            '',
            '+1234567890',
            '1234567890',
            '+44 20 7946 0958',
            '(555) 123-4567'
        ],
        invalid: [
            '123',
            '1'.repeat(16),
            'abc1234567',
            '+'
        ]
    }
};

/**
 * Run comprehensive validation tests
 */
export const runValidationTests = () => {
    const results = {
        email: { passed: 0, failed: 0, errors: [] as string[] },
        password: { passed: 0, failed: 0, errors: [] as string[] },
        name: { passed: 0, failed: 0, errors: [] as string[] },
        phone: { passed: 0, failed: 0, errors: [] as string[] }
    };

    // Test email validation
    validationTests.email.valid.forEach(email => {
        const result = validateEmail(email);
        if (result.isValid) {
            results.email.passed++;
        } else {
            results.email.failed++;
            results.email.errors.push(`Expected '${email}' to be valid`);
        }
    });

    validationTests.email.invalid.forEach(email => {
        const result = validateEmail(email);
        if (!result.isValid) {
            results.email.passed++;
        } else {
            results.email.failed++;
            results.email.errors.push(`Expected '${email}' to be invalid`);
        }
    });

    // Test password validation
    validationTests.password.weak.forEach(password => {
        const result = validatePassword(password);
        if (result.strength === 'weak' || !result.isValid) {
            results.password.passed++;
        } else {
            results.password.failed++;
            results.password.errors.push(`Expected '${password}' to be weak`);
        }
    });

    validationTests.password.strong.forEach(password => {
        const result = validatePassword(password);
        if (result.strength === 'strong' && result.isValid) {
            results.password.passed++;
        } else {
            results.password.failed++;
            results.password.errors.push(`Expected '${password}' to be strong`);
        }
    });

    // Test name validation
    validationTests.name.valid.forEach(name => {
        const result = validateName(name);
        if (result.isValid) {
            results.name.passed++;
        } else {
            results.name.failed++;
            results.name.errors.push(`Expected '${name}' to be valid`);
        }
    });

    validationTests.name.invalid.forEach(name => {
        const result = validateName(name);
        if (!result.isValid) {
            results.name.passed++;
        } else {
            results.name.failed++;
            results.name.errors.push(`Expected '${name}' to be invalid`);
        }
    });

    // Test phone validation
    validationTests.phone.valid.forEach(phone => {
        const result = validatePhoneNumber(phone);
        if (result.isValid) {
            results.phone.passed++;
        } else {
            results.phone.failed++;
            results.phone.errors.push(`Expected '${phone}' to be valid`);
        }
    });

    validationTests.phone.invalid.forEach(phone => {
        const result = validatePhoneNumber(phone);
        if (!result.isValid) {
            results.phone.passed++;
        } else {
            results.phone.failed++;
            results.phone.errors.push(`Expected '${phone}' to be invalid`);
        }
    });

    return results;
};
