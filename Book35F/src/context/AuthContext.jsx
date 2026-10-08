import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getProviderProfile,
  registerProvider,
  loginProvider,
  updateProviderProfile,
} from '../api.js';

const AuthContext = createContext(null);

const STORAGE_KEY = 'appointmentBookingAuth';

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredAuth(data) {
  try {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // storage full or blocked (e.g. a large base64 avatar); the profile is
    // re-fetched from the backend on the next load, so this is safe to skip
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [profileLoadError, setProfileLoadError] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    let storedAuth = null;

    Promise.resolve()
      .then(async () => {
        storedAuth = loadStoredAuth();
        if (!storedAuth) return null;

        try {
          const provider = await getProviderProfile(storedAuth.token);
          return { provider, token: storedAuth.token };
        } catch (profileError) {
          // Token expired or invalid: drop the stale session so ProtectedRoute
          // sends the user to /login instead of a dashboard where every call fails
          if (profileError.status === 401) {
            saveStoredAuth(null);
            return null;
          }
          if (isCurrent) {
            setProfileLoadError(`Unable to refresh your profile: ${profileError.message}`);
          }
          return storedAuth;
        }
      })
      .then((auth) => {
        if (!isCurrent || !auth) return;
        setUser(auth.provider);
        setToken(auth.token);
        saveStoredAuth(auth);
      })
      .finally(() => {
        if (isCurrent) setIsInitializing(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  

  const signup = async (fullName,businessName, email, password,phone, bio) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token: newToken } = await registerProvider({
        name: fullName, // backend expects "name", not "fullName"
        businessName,
        email,
        password,
        phone,
        bio,
      });
      const provider = await getProviderProfile(newToken);
      setUser(provider);
      setToken(newToken);
      saveStoredAuth({ provider, token: newToken });
      setProfileLoadError(null);
      return provider;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token: newToken } = await loginProvider({ email, password });
      const provider = await getProviderProfile(newToken);
      setUser(provider);
      setToken(newToken);
      saveStoredAuth({ provider, token: newToken });
      setProfileLoadError(null);
      return provider;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profile) => {
    if (!token) {
      throw new Error('You must be signed in to update your profile.');
    }

    const updatedProvider = await updateProviderProfile({ ...profile, token });
    setUser(updatedProvider);
    saveStoredAuth({ provider: updatedProvider, token });
    return updatedProvider;
  };

  // Stable reference so components can list it in effect dependencies
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    saveStoredAuth(null);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isInitializing,
    error,
    profileLoadError,
    signup,
    login,
    updateProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};