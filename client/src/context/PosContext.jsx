import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const PosContext = createContext(null);
const localCashier = { name: 'Local Cashier', email: 'Local POS' };

export function PosProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem('pos_authenticated') === 'true'
  );
  const [activeShift, setActiveShift] = useState(null);

  const refreshShift = useCallback(async () => {
    try {
      const res = await api.get('/shifts/current');
      setActiveShift(res.data?.data || null);
    } catch (_error) {
      setActiveShift(null);
    }
  }, []);

  useEffect(() => {
    if (authenticated) refreshShift();
  }, [authenticated, refreshShift]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    sessionStorage.setItem('pos_authenticated', 'true');
    setAuthenticated(true);
    return res.data.data.user;
  };

  const logout = () => {
    sessionStorage.removeItem('pos_authenticated');
    setAuthenticated(false);
    setActiveShift(null);
  };

  const openRegisterShift = async (openingFloat) => {
    const res = await api.post('/shifts/open', { openingFloat });
    setActiveShift(res.data.data);
    return res.data.data;
  };

  const closeRegisterShift = async (actualCash) => {
    const res = await api.post('/shifts/close', {
      actualCash,
      shiftId: activeShift?._id,
    });
    setActiveShift(null);
    return res.data;
  };

  return (
    <PosContext.Provider value={{
      user: localCashier,
      authenticated,
      login,
      logout,
      activeShift,
      refreshShift,
      openRegisterShift,
      closeRegisterShift,
    }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
}
