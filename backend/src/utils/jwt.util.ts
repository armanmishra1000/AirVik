import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BlacklistedToken } from '../models/blacklisted-token.model';

// JWT payload interfaces
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // TODO: Set in environment
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'; // TODO: Set in environment

// Token expiry times
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
export const REMEMBER_ME_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Generate JWT access token
 * @param payload Token payload with user information
 * @returns Signed JWT token
 */
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  // TODO: Implement access token generation with 15-minute expiry
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'airvik-booking-system',
    audience: 'airvik-users'
  });
};

/**
 * Generate JWT refresh token
 * @param payload Token payload with user and session information
 * @param rememberMe Whether to extend expiry for "remember me" functionality
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (
  payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>, 
  rememberMe: boolean = false
): string => {
  const expiry = rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_TOKEN_EXPIRY;
  
  // TODO: Implement refresh token generation with configurable expiry
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: expiry,
    issuer: 'airvik-booking-system',
    audience: 'airvik-refresh'
  });
};

/**
 * Verify and decode access token
 * @param token JWT access token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyAccessToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    // TODO: Check if token is blacklisted before verifying
    const isBlacklisted = await BlacklistedToken.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return null;
    }
    
    // Verify token signature and expiry
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'airvik-booking-system',
      audience: 'airvik-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    // TODO: Log token verification errors for security monitoring
    console.error('Access token verification failed:', error);
    return null;
  }
};

/**
 * Verify and decode refresh token
 * @param token JWT refresh token to verify
 * @returns Decoded payload or null if invalid
 */
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload | null> => {
  try {
    // TODO: Check if token is blacklisted before verifying
    const isBlacklisted = await BlacklistedToken.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return null;
    }
    
    // Verify token signature and expiry
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'airvik-booking-system',
      audience: 'airvik-refresh'
    }) as RefreshTokenPayload;
    
    return decoded;
  } catch (error) {
    // TODO: Log token verification errors for security monitoring
    console.error('Refresh token verification failed:', error);
    return null;
  }
};

/**
 * Add token to blacklist (for logout)
 * @param token JWT token to blacklist
 * @returns Promise resolving to blacklist result
 */
export const blacklistToken = async (token: string): Promise<boolean> => {
  try {
    // TODO: Get token expiry from payload before blacklisting
    const payload = getTokenPayload(token);
    if (!payload || !payload.exp) {
      return false;
    }
    
    const expiresAt = new Date(payload.exp * 1000); // Convert Unix timestamp to Date
    await BlacklistedToken.blacklistToken(token, expiresAt);
    
    return true;
  } catch (error) {
    // TODO: Log blacklisting errors
    console.error('Token blacklisting failed:', error);
    return false;
  }
};

/**
 * Decode token payload without verification (for expiry checking)
 * @param token JWT token to decode
 * @returns Decoded payload or null if invalid format
 */
export const getTokenPayload = (token: string): any | null => {
  try {
    // TODO: Decode token without verification to get payload
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('Token payload extraction failed:', error);
    return null;
  }
};

/**
 * Check if token is blacklisted
 * @param token JWT token to check
 * @returns Promise resolving to true if blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    // TODO: Delegate to BlacklistedToken model method
    return await BlacklistedToken.isTokenBlacklisted(token);
  } catch (error) {
    console.error('Blacklist check failed:', error);
    return false;
  }
};

/**
 * Hash token for secure storage
 * @param token Token to hash
 * @returns SHA-256 hash of token
 */
export const hashToken = (token: string): string => {
  // TODO: Use SHA-256 to hash tokens before storing
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate secure random token for sessions
 * @param length Length of random token in bytes
 * @returns Hex string of random bytes
 */
export const generateSecureToken = (length: number = 32): string => {
  // TODO: Generate cryptographically secure random token
  return crypto.randomBytes(length).toString('hex');
};
