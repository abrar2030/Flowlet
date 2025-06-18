import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored authentication token
    const token = localStorage.getItem('authToken');
    
    if (token) {
      apiService.setToken(token);
      // Verify token with backend
      verifyStoredToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyStoredToken = async () => {
    try {
      const response = await apiService.verifyToken();
      if (response.valid) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken');
        apiService.setToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      apiService.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await apiService.login(email, password);
      
      if (response.token) {
        apiService.setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      } else {
        return { success: false, error: 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      
      if (response.token) {
        apiService.setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, user: response.user };
      } else {
        return { success: false, error: 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    apiService.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (userData) => {
    try {
      const response = await apiService.updateProfile(userData);
      if (response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Update failed' };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      signup,
      logout,
      updateUser,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

