import { useState, useEffect } from 'react';
import { User } from '../types';

const SECRET_KEY = '9578078500';
const AUTH_STORAGE_KEY = 'invoice_app_auth';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface AuthSession {
  isAuthenticated: boolean;
  loginTime: string;
  expiresAt: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User>({ isAuthenticated: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const session: AuthSession = JSON.parse(storedAuth);
        const now = new Date().getTime();
        const expiresAt = new Date(session.expiresAt).getTime();

        if (now < expiresAt && session.isAuthenticated) {
          // Session is still valid
          setUser({
            isAuthenticated: true,
            loginTime: session.loginTime,
            authMethod: 'secret_key'
          });
        } else {
          // Session expired, clear it
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser({ isAuthenticated: false });
        }
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser({ isAuthenticated: false });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSecretKey = async (secretKey: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      if (secretKey === SECRET_KEY) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_DURATION);
        
        const session: AuthSession = {
          isAuthenticated: true,
          loginTime: now.toISOString(),
          expiresAt: expiresAt.toISOString()
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        
        setUser({
          isAuthenticated: true,
          loginTime: session.loginTime,
          authMethod: 'secret_key'
        });

        return { success: true };
      } else {
        return { success: false, error: 'Invalid secret key' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      setUser({ isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setUser({ isAuthenticated: false });
    }
  };

  const extendSession = () => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const session: AuthSession = JSON.parse(storedAuth);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_DURATION);
        
        const updatedSession: AuthSession = {
          ...session,
          expiresAt: expiresAt.toISOString()
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));
      }
    } catch (error) {
      console.error('Error extending session:', error);
    }
  };

  const getSessionInfo = () => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const session: AuthSession = JSON.parse(storedAuth);
        return {
          loginTime: session.loginTime,
          expiresAt: session.expiresAt,
          timeRemaining: new Date(session.expiresAt).getTime() - new Date().getTime()
        };
      }
    } catch (error) {
      console.error('Error getting session info:', error);
    }
    return null;
  };

  return { 
    user, 
    firebaseUser: null, // No Firebase user
    loginWithEmail: async () => ({ success: false, error: 'Email login not available' }),
    registerWithEmail: async () => ({ success: false, error: 'Email registration not available' }),
    resetPassword: async () => ({ success: false, error: 'Password reset not available' }),
    loginWithSecretKey,
    logout, 
    isLoading,
    extendSession,
    getSessionInfo
  };
};