import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import POSTerminal from './pages/POS/POSTerminal';
import Items from './pages/Items/Items';
import Receipts from './pages/Receipts/Receipts';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pos" element={<POSTerminal />} />
        <Route path="/items" element={<Items />} />
        <Route path="/receipts" element={<Receipts />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
