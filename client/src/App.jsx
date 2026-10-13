import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Login/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import POSTerminal from './pages/POS/POSTerminal';
import Items from './pages/Items/Items';
import Receipts from './pages/Receipts/Receipts';
import { usePos } from './context/PosContext';

function App() {
  const { authenticated } = usePos();

  return (
    <Routes>
      <Route path="/login" element={authenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={authenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/pos" element={authenticated ? <POSTerminal /> : <Navigate to="/login" replace />} />
        <Route path="/items" element={authenticated ? <Items /> : <Navigate to="/login" replace />} />
        <Route path="/receipts" element={authenticated ? <Receipts /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={authenticated ? '/dashboard' : '/login'} replace />} />
      </Route>
    </Routes>
  );
}

export default App;
