import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, setAuthToken, setAutoLogoutCallback, logUserLogin, logUserLogout } from '../lib/api';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string, role?: string) => Promise<void>;
  signOut: () => void;
  autoLogout: () => void; // For automatic logout scenarios (token expiry, etc.)
  updateUserProfile: (updates: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-logout function
  const autoLogout = async () => {
    // Log automatic logout (token expiry, session timeout, forced logout, etc.)
    if (user) {
      try {
        await logUserLogout(user.id);
      } catch (e) {
        console.error('Failed to log automatic logout activity', e);
      }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('wasLoggedIn');
    setAuthToken('');
    setUser(null);
    
    // Redirect to login
    window.location.href = '/login';
  };

  useEffect(() => {
    // Register auto-logout callback for API interceptor
    setAutoLogoutCallback(autoLogout);
  }, [user]);

  useEffect(() => {
    // Check for token in localStorage on mount
    const token = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');
    if (token && savedUser) {
      setAuthToken(token);
      setUser(JSON.parse(savedUser));
      localStorage.setItem('wasLoggedIn', 'true');
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const { token, user: userData } = await apiLogin({ email, password });
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    localStorage.setItem('wasLoggedIn', 'true');
    setUser(userData);
    
    // Log user activity
    try {
      await logUserLogin(userData.id, userData.full_name || 'Unknown', userData.email, userData.role);
    } catch (e) {
      console.error('Failed to log user login activity', e);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string, role: string = 'employee') => {
    await apiRegister({ email, password, full_name: fullName, role });
    // After signup, user needs to sign in separately
  };

  const signOut = async () => {
    // Log user logout activity (manual logout)
    if (user) {
      try {
        await logUserLogout(user.id);
      } catch (e) {
        console.error('Failed to log user logout activity', e);
      }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('wasLoggedIn');
    setAuthToken('');
    setUser(null);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile: user, isAdmin, signIn, signUp, signOut, autoLogout, updateUserProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
