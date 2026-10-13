import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PosProvider } from './context/PosContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PosProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </PosProvider>
    </BrowserRouter>
  </StrictMode>
);
