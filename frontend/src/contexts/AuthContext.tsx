import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Verify token is still valid by fetching current user
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Verify token by fetching current user
  const verifyToken = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setUser(response.data.user);
      setToken(authToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { token: newToken, user: userData } = response.data;

      setToken(newToken);
      setUser(userData);
      localStorage.setItem('authToken', newToken);
} catch (error: any) {
  console.error('Login failed:', error);

  if (error.response?.data) {
    const { message, errors } = error.response.data;

    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      throw {
        message: message || 'Please fix the highlighted fields.',
        errors,
      };
    }

    if (errors && Array.isArray(errors)) {
      const errorMessages = errors.map((err: any) => err.message).join(', ');
      throw { message: errorMessages || message || 'Login failed' };
    }

    if (message) {
      throw { message };
    }
  }

  throw { message: 'Login failed. Please check your credentials.' };
}

  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name,
      });
      // After successful registration, user can log in
} catch (error: any) {
  console.error('Registration failed:', error);

  if (error.response?.data) {
    const { message, errors } = error.response.data;

    // ✅ NEW: field-level errors from backend (object map)
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      throw {
        message: message || 'Please fix the highlighted fields.',
        errors, // { email?: string, password?: string }
      };
    }

    // 🧯 fallback for older array-style errors
    if (errors && Array.isArray(errors)) {
      const errorMessages = errors.map((err: any) => err.message).join(', ');
      throw { message: errorMessages || message || 'Registration failed' };
    }

    if (message) {
      throw { message };
    }
  }

  throw { message: 'Registration failed. Please try again.' };
}

  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
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
