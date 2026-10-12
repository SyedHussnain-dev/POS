import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Login/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import POSTerminal from './pages/POS/POSTerminal';
import Items from './pages/Items/Items';
import Receipts from './pages/Receipts/Receipts';
import LockScreen from './components/LockScreen/LockScreen';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--slate-950)',
        color: 'var(--slate-400)', fontSize: '14px', gap: '12px'
      }}>
        <div style={{
          width: '24px', height: '24px', border: '2px solid var(--slate-700)',
          borderTop: '2px solid var(--sky)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        Loading POS System…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <LockScreen />
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pos" element={<POSTerminal />} />
          <Route path="/items" element={<Items />} />
          <Route path="/receipts" element={<Receipts />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
