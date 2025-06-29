import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User>({ isAuthenticated: false });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        setFirebaseUser(firebaseUser);
        setUser({ 
          isAuthenticated: true, 
          email: firebaseUser.email || undefined,
          uid: firebaseUser.uid,
          authMethod: 'firebase'
        });
        setIsLoading(false);
      } else {
        // No Firebase user
        setFirebaseUser(null);
        setUser({ isAuthenticated: false });
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
      return { success: true };
    } catch (error: any) {
      console.error('Email login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
      }
      
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const registerWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
      return { success: true };
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email registration is not enabled.';
          break;
      }
      
      setIsLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Password reset error:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
      setUser({ isAuthenticated: false });
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Firebase signOut fails
      setUser({ isAuthenticated: false });
      setFirebaseUser(null);
    }
  };

  return { 
    user, 
    firebaseUser,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    logout, 
    isLoading 
  };
};