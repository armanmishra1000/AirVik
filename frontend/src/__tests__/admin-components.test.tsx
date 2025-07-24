import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsersList from '../components/admin/UsersList';
import RoleManagement from '../components/admin/RoleManagement';
import { User, UserRole } from '../types/auth.types';
import { authService } from '../services/auth.service';

// Mock the auth service
jest.mock('../services/auth.service', () => ({
  authService: {
    getAllUsers: jest.fn(),
    updateUserStatus: jest.fn(),
    resendVerificationEmail: jest.fn(),
    deleteUser: jest.fn(),
    updateUserRole: jest.fn(),
  },
}));

// Mock data for testing
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.CUSTOMER,
    isEmailVerified: true,
    isActive: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    fullName: 'John Doe',
    preferences: {
      newsletter: true,
      notifications: true,
      language: 'en'
    },
    metadata: {}
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.MANAGER,
    isEmailVerified: false,
    isActive: true,
    createdAt: '2023-01-02T00:00:00.000Z',
    updatedAt: '2023-01-02T00:00:00.000Z',
    fullName: 'Jane Smith',
    preferences: {
      newsletter: false,
      notifications: true,
      language: 'en'
    },
    metadata: {}
  },
  {
    id: '3',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isEmailVerified: true,
    isActive: true,
    createdAt: '2023-01-03T00:00:00.000Z',
    updatedAt: '2023-01-03T00:00:00.000Z',
    fullName: 'Admin User',
    preferences: {
      newsletter: true,
      notifications: true,
      language: 'en'
    },
    metadata: {}
  }
];

// Mock successful API response
const mockSuccessResponse = {
  success: true,
  data: mockUsers,
  pagination: {
    page: 1,
    limit: 10,
    total: 3,
    totalPages: 1
  }
};

describe('UsersList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response by default
    (authService.getAllUsers as jest.Mock).mockResolvedValue(mockSuccessResponse);
  });

  test('renders loading state initially', () => {
    render(<UsersList />);
    
    // Check for loading indicators
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Should show skeleton loading UI elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('renders user data after loading', async () => {
    render(<UsersList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check if user data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  test('handles sorting when column header is clicked', async () => {
    render(<UsersList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Click on Name column header to sort
    fireEvent.click(screen.getByText('Name'));
    
    // Verify that getAllUsers was called with sorting parameters
    expect(authService.getAllUsers).toHaveBeenCalledTimes(2);
  });

  test('handles filtering when filter options are changed', async () => {
    render(<UsersList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Change role filter to Admin
    const roleFilter = screen.getByLabelText(/role/i);
    fireEvent.change(roleFilter, { target: { value: 'admin' } });
    
    // Verify that getAllUsers was called with filter parameters
    expect(authService.getAllUsers).toHaveBeenCalledTimes(2);
  });

  test('handles search when search term is entered', async () => {
    render(<UsersList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Enter search term
    const searchInput = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    // Submit search form
    fireEvent.submit(searchInput.closest('form')!);
    
    // Verify that getAllUsers was called with search parameters
    expect(authService.getAllUsers).toHaveBeenCalledTimes(2);
  });

  test('handles error state', async () => {
    // Mock error response
    (authService.getAllUsers as jest.Mock).mockRejectedValue({
      statusCode: 500,
      message: 'Internal server error'
    });
    
    render(<UsersList />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/failed to load users/i)).toBeInTheDocument();
    });
  });

  test('handles toggle user status', async () => {
    (authService.updateUserStatus as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockUsers[0], isActive: false }
    });
    
    render(<UsersList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Find and click toggle status button for first user
    const toggleButtons = screen.getAllByLabelText(/toggle active status/i);
    fireEvent.click(toggleButtons[0]);
    
    // Verify that updateUserStatus was called
    await waitFor(() => {
      expect(authService.updateUserStatus).toHaveBeenCalledWith('1', false);
    });
  });

  test('handles resend verification email', async () => {
    (authService.resendVerificationEmail as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Verification email sent successfully'
    });
    
    render(<UsersList />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Find and click resend verification button for second user (unverified)
    const resendButtons = screen.getAllByLabelText(/resend verification/i);
    fireEvent.click(resendButtons[0]);
    
    // Verify that resendVerificationEmail was called
    await waitFor(() => {
      expect(authService.resendVerificationEmail).toHaveBeenCalled();
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/verification email sent successfully/i)).toBeInTheDocument();
    });
  });
});

describe('RoleManagement Component', () => {
  const mockUser = mockUsers[0];
  const onClose = jest.fn();
  const onRoleUpdated = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (authService.updateUserRole as jest.Mock).mockResolvedValue({
      success: true,
      data: { ...mockUser, role: UserRole.MANAGER }
    });
  });
  
  test('renders user information correctly', () => {
    render(
      <RoleManagement 
        user={mockUser}
        onClose={onClose}
        onRoleUpdated={onRoleUpdated}
      />
    );
    
    // Check if user info is displayed
    expect(screen.getByText(`${mockUser.firstName} ${mockUser.lastName}`)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    expect(screen.getByText(mockUser.role, { exact: false })).toBeInTheDocument();
  });
  
  test('handles role selection', () => {
    render(
      <RoleManagement 
        user={mockUser}
        onClose={onClose}
        onRoleUpdated={onRoleUpdated}
      />
    );
    
    // Find and click manager role option
    const managerRoleOption = screen.getByText(/manager/i).closest('div');
    fireEvent.click(managerRoleOption!);
    
    // Check if manager role is selected (has blue border)
    expect(managerRoleOption).toHaveClass('border-blue-500');
  });
  
  test('disables submit button when no role change', () => {
    render(
      <RoleManagement 
        user={mockUser}
        onClose={onClose}
        onRoleUpdated={onRoleUpdated}
      />
    );
    
    // Submit button should be disabled initially (no role change)
    const submitButton = screen.getByText('Update Role');
    expect(submitButton).toBeDisabled();
  });
  
  test('handles form submission', async () => {
    render(
      <RoleManagement 
        user={mockUser}
        onClose={onClose}
        onRoleUpdated={onRoleUpdated}
      />
    );
    
    // Select manager role
    const managerRoleOption = screen.getByText(/manager/i).closest('div');
    fireEvent.click(managerRoleOption!);
    
    // Submit form
    const submitButton = screen.getByText('Update Role');
    fireEvent.click(submitButton);
    
    // Check for loading state
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    
    // Verify that updateUserRole was called
    await waitFor(() => {
      expect(authService.updateUserRole).toHaveBeenCalledWith(mockUser.id, UserRole.MANAGER);
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/user role updated successfully/i)).toBeInTheDocument();
    });
    
    // Verify that onRoleUpdated was called with updated user
    await waitFor(() => {
      expect(onRoleUpdated).toHaveBeenCalledWith({
        ...mockUser,
        role: UserRole.MANAGER
      });
    });
    
    // Verify that modal closes after success
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
  
  test('handles error during role update', async () => {
    // Mock error response
    (authService.updateUserRole as jest.Mock).mockRejectedValue({
      statusCode: 403,
      message: 'Permission denied'
    });
    
    render(
      <RoleManagement 
        user={mockUser}
        onClose={onClose}
        onRoleUpdated={onRoleUpdated}
      />
    );
    
    // Select manager role
    const managerRoleOption = screen.getByText(/manager/i).closest('div');
    fireEvent.click(managerRoleOption!);
    
    // Submit form
    const submitButton = screen.getByText('Update Role');
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
    });
    
    // Verify that onRoleUpdated was not called
    expect(onRoleUpdated).not.toHaveBeenCalled();
    
    // Verify that modal did not close
    expect(onClose).not.toHaveBeenCalled();
  });
});
