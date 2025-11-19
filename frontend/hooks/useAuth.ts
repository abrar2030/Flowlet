import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { validateToken, refreshToken } from '@/store/authSlice';
import { authService } from '@/lib/authService';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector(state => state.auth);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated() && !isAuthenticated) {
        try {
          await dispatch(validateToken()).unwrap();
        } catch (error) {
          console.error('Token validation failed:', error);
          authService.logout();
        }
      }
      setInitialized(true);
    };

    if (!initialized) {
      initAuth();
    }
  }, [dispatch, isAuthenticated, initialized]);

  const refreshAuthToken = async () => {
    try {
      await dispatch(refreshToken()).unwrap();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || !initialized,
    error,
    refreshAuthToken,
  };
};
