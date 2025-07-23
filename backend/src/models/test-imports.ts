// Test file to verify schema imports work without errors
import { User, UserRole, IUser } from './user.model';
import { EmailVerificationToken, IEmailVerificationToken } from './email-verification-token.model';
import { RefreshToken, IRefreshToken } from './refresh-token.model';

console.log('User model imported successfully:', !!User);
console.log('UserRole enum imported successfully:', Object.values(UserRole));
console.log('EmailVerificationToken model imported successfully:', !!EmailVerificationToken);
console.log('RefreshToken model imported successfully:', !!RefreshToken);

// This file is just for testing imports and will be deleted after verification
