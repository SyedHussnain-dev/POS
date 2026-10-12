import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pos_token') || '');
  const [activeShift, setActiveShift] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Refresh Active Shift ──
  const refreshShift = useCallback(async (userId) => {
    try {
      const currentUserId = userId || user?.id || user?._id;
      const res = await api.get('/shifts/current', {
        params: currentUserId ? { cashierId: currentUserId } : {},
      });
      if (res.data?.success) {
        setActiveShift(res.data.data);
      }
    } catch (_err) {
      setActiveShift(null);
    }
  }, [user]);

  // ── Initialize Auth State ──
  useEffect(() => {
    async function initAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          setUser(res.data.data.user);
          setActiveShift(res.data.data.activeShift);
        } else {
          localStorage.removeItem('pos_token');
          setToken('');
        }
      } catch (_err) {
        localStorage.removeItem('pos_token');
        setToken('');
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [token]);

  // ── Terminal Lock Controls ──
  useEffect(() => {
    if (!user || isLocked) return undefined;

    const idleTimeoutMs = 5 * 60 * 1000;
    let idleTimer;
    const lock = () => setIsLocked(true);
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(lock, idleTimeoutMs);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') lock();
      else resetIdleTimer();
    };
    const activityEvents = ['pointerdown', 'pointermove', 'touchstart', 'scroll'];

    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer, { passive: true }));
    window.addEventListener('keydown', handleKeyDown);
    resetIdleTimer();

    return () => {
      window.clearTimeout(idleTimer);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer));
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, isLocked]);

  // ── Login with Email & Password ──
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem('pos_token', newToken);
      setToken(newToken);
      setUser(userData);
      setActiveShift(userData.activeShift || null);
      setIsLocked(false);
      return userData;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  // ── Quick PIN Switch / Fast Unlock ──
  const pinSwitch = async (pin) => {
    const res = await api.post('/auth/pin-switch', { pin });
    if (res.data?.success) {
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem('pos_token', newToken);
      setToken(newToken);
      setUser(userData);
      setActiveShift(userData.activeShift || null);
      setIsLocked(false);
      return userData;
    }
    throw new Error(res.data?.message || 'Invalid PIN');
  };

  // ── Open Register Shift ──
  const openRegisterShift = async (openingFloat) => {
    const res = await api.post('/shifts/open', { openingFloat });
    if (res.data?.success) {
      setActiveShift(res.data.data);
      if (user) {
        setUser({ ...user, activeShiftId: res.data.data._id });
      }
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to open register');
  };

  // ── Close Register Shift (Z-Report) ──
  const closeRegisterShift = async (actualCash) => {
    const res = await api.post('/shifts/close', {
      actualCash,
      shiftId: activeShift?._id,
    });
    if (res.data?.success) {
      setActiveShift(null);
      if (user) {
        setUser({ ...user, activeShiftId: null });
      }
      return res.data;
    }
    throw new Error(res.data?.message || 'Failed to close register');
  };

  // ── Logout ──
  const logout = () => {
    localStorage.removeItem('pos_token');
    setToken('');
    setUser(null);
    setActiveShift(null);
    setIsLocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeShift,
        isLocked,
        loading,
        setIsLocked,
        login,
        pinSwitch,
        logout,
        openRegisterShift,
        closeRegisterShift,
        refreshShift,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
