'use client';

import React, { useEffect, useState } from 'react';
import { PasswordStrengthIndicatorProps, PasswordStrength } from '../../types/password-reset.types';

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  className = '',
  onStrengthChange,
}) => {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    level: 'weak',
    feedback: [],
    meetsPolicy: false,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      numbers: false,
      specialChars: false,
    },
  });

  const calculateStrength = (password: string): PasswordStrength => {
    // TODO: Implement comprehensive password strength calculation
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      specialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    const score = Math.min(4, metRequirements);

    const levels: ('weak' | 'fair' | 'good' | 'strong')[] = ['weak', 'fair', 'good', 'strong'];
    const level = levels[Math.min(3, score - 1)] || 'weak';

    const feedback: string[] = [];
    if (!requirements.length) feedback.push('At least 8 characters');
    if (!requirements.uppercase) feedback.push('One uppercase letter');
    if (!requirements.lowercase) feedback.push('One lowercase letter');
    if (!requirements.numbers) feedback.push('One number');

    const meetsPolicy = requirements.length && requirements.uppercase && 
                       requirements.lowercase && requirements.numbers;

    return {
      score,
      level,
      feedback,
      meetsPolicy,
      requirements,
    };
  };

  useEffect(() => {
    const newStrength = calculateStrength(password);
    setStrength(newStrength);
    
    if (onStrengthChange) {
      onStrengthChange(newStrength);
    }
  }, [password, onStrengthChange]);

  const getStrengthColor = (level: string) => {
    // TODO: Return appropriate Tailwind color classes
    switch (level) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = (score: number) => {
    // TODO: Convert score to percentage width
    return `${(score / 4) * 100}%`;
  };

  if (!password) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Meter */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium capitalize ${
            strength.level === 'weak' ? 'text-red-600' :
            strength.level === 'fair' ? 'text-yellow-600' :
            strength.level === 'good' ? 'text-blue-600' :
            'text-green-600'
          }`}>
            {strength.level}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength.level)}`}
            style={{ width: getStrengthWidth(strength.score) }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Password Requirements:</h4>
          <div className="space-y-1">
            <RequirementItem
              met={strength.requirements.length}
              text="At least 8 characters"
            />
            <RequirementItem
              met={strength.requirements.uppercase}
              text="One uppercase letter (A-Z)"
            />
            <RequirementItem
              met={strength.requirements.lowercase}
              text="One lowercase letter (a-z)"
            />
            <RequirementItem
              met={strength.requirements.numbers}
              text="One number (0-9)"
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">To improve: </span>
          {strength.feedback.join(', ')}
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        met ? 'bg-green-100' : 'bg-gray-100'
      }`}>
        {met ? (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${met ? 'text-green-700' : 'text-gray-600'}`}>
        {text}
      </span>
    </div>
  );
};

// Export utility function for use in other components
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    specialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const score = Math.min(4, metRequirements);

  const levels: ('weak' | 'fair' | 'good' | 'strong')[] = ['weak', 'fair', 'good', 'strong'];
  const level = levels[Math.min(3, score - 1)] || 'weak';

  const feedback: string[] = [];
  if (!requirements.length) feedback.push('At least 8 characters');
  if (!requirements.uppercase) feedback.push('One uppercase letter');
  if (!requirements.lowercase) feedback.push('One lowercase letter');
  if (!requirements.numbers) feedback.push('One number');

  const meetsPolicy = requirements.length && requirements.uppercase && 
                     requirements.lowercase && requirements.numbers;

  return {
    score,
    level,
    feedback,
    meetsPolicy,
    requirements,
  };
};
