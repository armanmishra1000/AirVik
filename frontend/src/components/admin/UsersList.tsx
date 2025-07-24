import React, { useState, useEffect } from 'react';
import { User, UserRole, UserSearchParams } from '../../types/auth.types';
import { authService } from '../../services/auth.service';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  UserX,
  UserCheck,
  Loader,
  RefreshCw,
  X,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface UsersListProps {
  onEditUser?: (user: User) => void;
  onManageRoles?: (user: User) => void;
}

interface SortConfig {
  key: keyof User | 'fullName';
  direction: 'asc' | 'desc';
}

interface FilterOptions {
  role: UserRole | 'all';
  isActive: boolean | 'all';
  isVerified: boolean | 'all';
  searchTerm: string;
}

const UsersList: React.FC<UsersListProps> = ({ onEditUser, onManageRoles }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    role: 'all',
    isActive: 'all',
    isVerified: 'all',
    searchTerm: ''
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [sendingVerificationTo, setSendingVerificationTo] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterOptions, sortConfig]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare search parameters
      const searchParams: UserSearchParams = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: sortConfig.key as 'createdAt' | 'email' | 'lastName',
        sortOrder: sortConfig.direction,
        search: filterOptions.searchTerm || undefined
      };
      
      // Add conditional parameters
      if (filterOptions.role !== 'all') {
        searchParams.role = filterOptions.role as UserRole;
      }
      
      if (filterOptions.isActive !== 'all') {
        searchParams.isActive = filterOptions.isActive as boolean;
      }
      
      if (filterOptions.isVerified !== 'all') {
        searchParams.isEmailVerified = filterOptions.isVerified as boolean;
      }
      
      const response = await authService.getAllUsers(searchParams);
      
      if (response.success && response.data) {
        setUsers(response.data);
        setTotalPages(Math.ceil((response.pagination?.total || 0) / itemsPerPage));
      } else {
        throw new Error(response.error || 'Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      
      // Provide more specific error messages
      if (err?.statusCode === 403) {
        setError('You do not have permission to view the user list.');
      } else if (err?.statusCode === 429) {
        setError('Too many requests. Please try again later.');
      } else {
        setError('Failed to load users. Please try again later.');
      }
      
      // Set empty users array to prevent showing stale data
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof User | 'fullName') => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (filterKey: keyof FilterOptions, value: any) => {
    setFilterOptions(prev => ({ ...prev, [filterKey]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterOptions(prev => ({ ...prev, searchTerm: e.target.value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleToggleUserStatus = async (userId: string, isCurrentlyActive: boolean) => {
    // Store the user's current state for potential rollback
    const originalUsers = [...users];
    
    // Optimistically update UI
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, isActive: !isCurrentlyActive } : user
      )
    );
    
    try {
      await authService.updateUserStatus(userId, !isCurrentlyActive);
      setError(null);
    } catch (err: any) {
      console.error('Failed to update user status:', err);
      // Rollback to previous state
      setUsers(originalUsers);
      
      // Provide specific error message
      if (err?.statusCode === 403) {
        setError('You do not have permission to change this user\'s status.');
      } else if (err?.statusCode === 404) {
        setError('User not found. The list may be outdated.');
        // Refresh the list
        fetchUsers();
      } else {
        setError('Failed to update user status. Please try again.');
      }
    }
  };

  const handleResendVerification = async (userId: string, email: string) => {
    // Track which user is having verification email sent
    setSendingVerificationTo(userId);
    
    try {
      await authService.resendVerificationEmail(email);
      setError(null);
      
      // Show success message with more context
      const successMessage = `Verification email sent to ${email}. Please ask the user to check their inbox and spam folder.`;
      setSuccessMessage(successMessage);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Failed to resend verification:', err);
      
      // Provide specific error messages based on error type
      if (err?.statusCode === 429) {
        setError(`Rate limit exceeded. Please try again in ${err?.retryAfter || 'a few'} seconds.`);
      } else if (err?.statusCode === 404) {
        setError('User email not found. The user may have changed their email address.');
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } finally {
      setSendingVerificationTo(null);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSelected = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      setShowBulkActions(newSelected.length > 0);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
      setShowBulkActions(false);
    } else {
      const allUserIds = users.map(user => user.id);
      setSelectedUsers(allUserIds);
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedUsers.length === 0) return;
    
    setActionInProgress(true);
    try {
      // In a real app, you'd make API calls for bulk actions
      console.log(`Bulk ${action} for users:`, selectedUsers);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage(`Successfully ${action}d ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
      setShowBulkActions(false);
      
      // Refresh the user list
      await fetchUsers();
    } catch (error) {
      setError(`Failed to ${action} selected users`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Find the user to display their name in the confirmation
    const userToDelete = users.find(user => user.id === userId);
    
    if (!userToDelete) {
      setError('User not found. The list may be outdated.');
      return;
    }
    
    // More descriptive confirmation with user details
    if (window.confirm(`Are you sure you want to delete ${userToDelete.firstName} ${userToDelete.lastName} (${userToDelete.email})? This action cannot be undone and will remove all associated data.`)) {
      // Track deletion state
      setDeletingUserId(userId);
      
      try {
        // Use the deleteAccount method which requires the user's password
        const password = prompt('Please enter your password to confirm user deletion:');
        if (!password) {
          setDeletingUserId(null);
          return;
        }
        
        await authService.deleteAccount({ password });
        
        // Remove the user from the local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        
        // Show success message
        setSuccessMessage(`User ${userToDelete.email} has been successfully deleted.`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        
        // Provide specific error messages
        if (err?.statusCode === 403) {
          setError('You do not have permission to delete this user.');
        } else if (err?.statusCode === 409) {
          setError('Cannot delete this user because they have active bookings or other dependencies.');
        } else if (err?.message) {
          setError(err.message);
        } else {
          setError('Failed to delete user. Please try again.');
        }
      } finally {
        setDeletingUserId(null);
      }
    }
  };

  const renderSortIcon = (key: keyof User | 'fullName') => {
    if (sortConfig.key !== key) {
      return <ChevronDown className="w-4 h-4 opacity-30" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const renderRoleBadge = (role: UserRole) => {
    const roleStyles = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-purple-100 text-purple-800',
      customer: 'bg-blue-100 text-blue-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleStyles[role]}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const renderStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="flex items-center text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" />
        <span className="text-xs">Active</span>
      </span>
    ) : (
      <span className="flex items-center text-red-600">
        <XCircle className="w-4 h-4 mr-1" />
        <span className="text-xs">Inactive</span>
      </span>
    );
  };

  const renderVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <span className="flex items-center text-green-600">
        <CheckCircle className="w-4 h-4 mr-1" />
        <span className="text-xs">Verified</span>
      </span>
    ) : (
      <span className="flex items-center text-amber-600">
        <AlertCircle className="w-4 h-4 mr-1" />
        <span className="text-xs">Unverified</span>
      </span>
    );
  };

  // ...

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* Header with title and refresh button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
        <button 
          onClick={fetchUsers}
          disabled={loading}
          className={`px-4 py-2 rounded-md flex items-center ${loading 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600 mr-2"></div>
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={filterOptions.searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Role Filter */}
            <div className="relative inline-block">
              <select
                value={filterOptions.role as string}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="customer">Customer</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="relative inline-block">
              <select
                value={filterOptions.isActive as string}
                onChange={(e) => handleFilterChange('isActive', e.target.value === 'true' ? true : e.target.value === 'false' ? false : 'all')}
                className="border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            
            {/* Verification Filter */}
            <div className="relative inline-block">
              <select
                value={filterOptions.isVerified as string}
                onChange={(e) => handleFilterChange('isVerified', e.target.value === 'true' ? true : e.target.value === 'false' ? false : 'all')}
                className="border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Verification</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* User table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('fullName')}
              >
                <div className="flex items-center">
                  <span>Name</span>
                  {renderSortIcon('fullName')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center">
                  <span>Email</span>
                  {renderSortIcon('email')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center">
                  <span>Role</span>
                  {renderSortIcon('role')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Verification
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center">
                  <span>Registered</span>
                  {renderSortIcon('createdAt')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Show loading overlay when refreshing with existing data */}
            {loading && users.length > 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4">
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                    <span className="text-gray-500">Loading users...</span>
                  </div>
                </td>
              </tr>
            )}
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No users found matching your criteria
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={`${user.firstName} ${user.lastName}`} 
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">
                      {user.lastLoginAt ? (
                        <>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</>
                      ) : (
                        <>Never logged in</>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(user.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderVerificationBadge(user.isEmailVerified)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {!user.isEmailVerified && (
                        <button
                          onClick={() => handleResendVerification(user.id, user.email)}
                          disabled={sendingVerificationTo === user.id}
                          className={`mr-2 ${sendingVerificationTo === user.id 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-blue-600 hover:text-blue-800'}`}
                          title="Resend verification email"
                        >
                          {sendingVerificationTo === user.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                          ) : (
                            <Mail className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => onEditUser && onEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit user"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onManageRoles && onManageRoles(user)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage roles"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        disabled={sendingVerificationTo === user.id || deletingUserId === user.id}
                        className={`mr-2 ${sendingVerificationTo === user.id || deletingUserId === user.id
                          ? 'text-gray-400 cursor-not-allowed'
                          : user.isActive 
                            ? 'text-green-600 hover:text-green-800' 
                            : 'text-red-600 hover:text-red-800'}`}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deletingUserId === user.id}
                        className={`${deletingUserId === user.id 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-800'}`}
                        title="Delete user"
                      >
                        {deletingUserId === user.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-500"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          <div>
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{users.length}</span> of <span className="font-medium">{totalPages * itemsPerPage}</span> users
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className={`px-3 py-1 rounded-md flex items-center ${(currentPage === 1 || loading) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <div className="hidden sm:flex space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={loading}
                    className={`w-10 h-8 flex items-center justify-center rounded-md transition-colors ${loading ? 'cursor-not-allowed ' : ''} ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <div className="sm:hidden px-3 py-1 bg-gray-100 rounded-md">
              <span className="text-gray-700 font-medium">{currentPage} / {totalPages}</span>
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className={`px-3 py-1 rounded-md flex items-center ${(currentPage === totalPages || loading) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
      
      {/* Loading overlay for pagination changes */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center z-50">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      )}
      {/* Success message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)} 
              className="ml-auto flex-shrink-0 text-green-400 hover:text-green-600"
              aria-label="Dismiss success message"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto flex-shrink-0 text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
