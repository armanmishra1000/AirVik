import React, { useState, useEffect, ReactElement } from 'react';
import { User, UserRole } from '../../types/auth.types';
import { authService } from '../../services/auth.service';
import { 
  AlertCircle, 
  CheckCircle, 
  Shield, 
  Users, 
  User as UserIcon,
  X,
  Loader
} from 'lucide-react';

interface RoleManagementProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onRoleUpdated?: (user: User) => void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ 
  user, 
  isOpen, 
  onClose,
  onRoleUpdated
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      // Reset states when user changes
      setError(null);
      setSuccess(null);
      setValidationError(null);
    }
  }, [user]);
  
  // Clear error when role changes or user changes
  useEffect(() => {
    setValidationError(null);
    setError(null);
    setSuccess(null);
  }, [selectedRole, user]);

  if (!isOpen || !user) {
    return null;
  }

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null); // Clear any previous errors
    
    // Validate role change
    if (user.role === role) {
      setValidationError('Please select a different role than the current one');
    } else {
      setValidationError(null);
    }
  };

  const validateRoleChange = (): boolean => {
    // Check if role is selected
    if (!selectedRole) {
      setValidationError('Please select a role');
      return false;
    }
    
    // Check if role is different from current
    if (selectedRole === user.role) {
      setValidationError('Please select a different role than the current one');
      return false;
    }
    
    // Check if trying to set admin role for self (optional security check)
    // This would require checking the current user's ID against the target user
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    // Validate before submission
    if (!selectedRole || !validateRoleChange()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update the user's role
      const updatedUser = await authService.updateUserRole(user.id, selectedRole);
      
      setSuccess(`User role updated successfully to ${selectedRole}`);
      
      if (onRoleUpdated) {
        onRoleUpdated({
          ...user,
          role: selectedRole
        });
      }
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      
      // Provide specific error messages based on error type
      if (err?.response?.status === 403) {
        setError('You do not have permission to update this user\'s role.');
      } else if (err?.response?.status === 404) {
        setError('User not found. The list may be outdated.');
      } else if (err?.response?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (err?.response?.status === 400 && err?.response?.data?.field === 'role') {
        setError(`Invalid role selected: ${err?.response?.data?.message || 'Please select a valid role'}`);
      } else {
        setError(err?.response?.data?.message || 'Failed to update user role. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions: Record<string, string> = {
    [UserRole.CUSTOMER]: 'Can book rooms and manage own bookings',
    [UserRole.MANAGER]: 'Can manage rooms, bookings, and view customer data',
    [UserRole.ADMIN]: 'Full access to all system features and user management'
  };

  const roleIcons: Record<string, ReactElement> = {
    [UserRole.CUSTOMER]: <UserIcon className="w-6 h-6" />,
    [UserRole.MANAGER]: <Users className="w-6 h-6" />,
    [UserRole.ADMIN]: <Shield className="w-6 h-6" />
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Manage User Role
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="mt-2 text-sm text-gray-600">Updating user role...</p>
              </div>
            </div>)}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Role
              </label>
              <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
                {roleIcons[user.role]}
                <span className="ml-2 font-medium capitalize">{user.role}</span>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Role
              </label>
              <div className="space-y-3">
                {(Object.values(UserRole) as UserRole[]).map((role) => (
                  <div 
                    key={role}
                    onClick={() => !loading && handleRoleChange(role)}
                    className={`flex items-start p-3 rounded-md cursor-pointer border transition-colors ${loading ? 'opacity-60 cursor-not-allowed' : ''} ${
                      selectedRole === role 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    role="radio"
                    aria-checked={selectedRole === role}
                    tabIndex={loading ? -1 : 0}
                    onKeyDown={(e) => {
                      if (!loading && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleRoleChange(role);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {roleIcons[role as UserRole]}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {role}
                      </div>
                      <div className="text-sm text-gray-500">
                        {roleDescriptions[role]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {(error || validationError) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error || validationError}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => error ? setError(null) : setValidationError(null)}
                    className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
                    aria-label="Dismiss error"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                          <div className="bg-green-500 h-1.5 rounded-full animate-shrink"></div>
                        </div>
                        <p className="text-xs text-green-600">Closing...</p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSuccess(null)}
                    className="ml-auto flex-shrink-0 text-green-400 hover:text-green-600"
                    aria-label="Dismiss success message"
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${loading 
                  ? 'text-gray-400 bg-gray-50 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || selectedRole === user.role || validationError !== null}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors ${
                  loading || selectedRole === user.role || validationError !== null
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
                aria-busy={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Updating...</span>
                  </div>
                ) : (
                  'Update Role'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
};

export default RoleManagement;
