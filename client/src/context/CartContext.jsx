import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const CartContext = createContext(null);

// ── Web Audio Beep Synthesizer ──
function playBeep(frequency = 880, duration = 0.08) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_e) {
    // Audio context not allowed or unsupported
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [heldCarts, setHeldCarts] = useState([]);
  const [lastScannedBarcode, setLastScannedBarcode] = useState(null);

  // ── Financial Calculations ──
  const subtotal = Number(
    items.reduce((sum, item) => sum + (item.price || item.unitPrice || 0) * item.qty, 0).toFixed(2)
  );

  const discountTotal = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const discountedSubtotal = Math.max(0, subtotal - discountTotal);

  const taxTotal = Number(
    items
      .reduce((sum, item) => {
        const itemSubtotal = (item.price || item.unitPrice || 0) * item.qty;
        const rate = (item.taxRate || 0) / 100;
        return sum + itemSubtotal * rate;
      }, 0)
      .toFixed(2)
  );

  const grandTotal = Number((discountedSubtotal + taxTotal).toFixed(2));

  // ── Add to Cart ──
  const addToCart = useCallback((product, qty = 1) => {
    playBeep(980, 0.06);
    setItems((prev) => {
      const existing = prev.find(
        (i) => (i.productId || i._id) === (product._id || product.productId)
      );
      if (existing) {
        return prev.map((i) =>
          (i.productId || i._id) === (product._id || product.productId)
            ? { ...i, qty: i.qty + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id || product.productId,
          name: product.name,
          price: product.sellingPrice || product.price,
          unitPrice: product.sellingPrice || product.price,
          category: product.category,
          barcode: product.barcode,
          sku: product.sku,
          taxRate: product.taxRate || 0,
          qty,
        },
      ];
    });
  }, []);

  // ── Update Quantity ──
  const updateQty = useCallback((productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        (i.productId || i._id) === productId ? { ...i, qty } : i
      )
    );
  }, []);

  // ── Remove From Cart ──
  const removeFromCart = useCallback((productId) => {
    setItems((prev) =>
      prev.filter((i) => (i.productId || i._id) !== productId)
    );
  }, []);

  // ── Clear Cart ──
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountPercent(0);
  }, []);

  // ── Fetch Held Carts ──
  const fetchHeldCarts = useCallback(async () => {
    try {
      const res = await api.get('/orders/held');
      if (res.data?.success) {
        setHeldCarts(res.data.data);
      }
    } catch (_err) {
      setHeldCarts([]);
    }
  }, []);

  useEffect(() => {
    fetchHeldCarts();
  }, [fetchHeldCarts]);

  // ── Hold Current Cart ──
  const holdCurrentCart = async (customerName = 'Walk-in Customer', note = '') => {
    if (!items.length) return false;
    const res = await api.post('/orders/hold', {
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.qty,
        unitPrice: i.price,
        subtotal: i.price * i.qty,
      })),
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      customer: { name: customerName },
      holdNote: note || `Held at ${new Date().toLocaleTimeString()}`,
    });

    if (res.data?.success) {
      clearCart();
      fetchHeldCarts();
      return true;
    }
    return false;
  };

  // ── Resume Held Cart ──
  const resumeHeldCart = async (heldOrder) => {
    const formattedItems = heldOrder.items.map((i) => ({
      productId: i.productId?._id || i.productId,
      name: i.name,
      price: i.unitPrice,
      unitPrice: i.unitPrice,
      qty: i.quantity,
    }));
    setItems(formattedItems);
    await api.delete(`/orders/held/${heldOrder._id}`);
    fetchHeldCarts();
    playBeep(660, 0.1);
  };

  // ── Hardware Barcode Scanner Listener ──
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // Ignore if typing inside input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const barcode = buffer.trim();
          setLastScannedBarcode(barcode);
          // Auto-fetch product by barcode and add
          api.get(`/products/barcode/${barcode}`)
            .then((res) => {
              if (res.data?.data) {
                addToCart(res.data.data, 1);
              }
            })
            .catch(() => {
              // Not found
            });
        }
        buffer = '';
      } else if (e.key.length === 1) {
        // High speed hardware scanner typing (< 50ms)
        if (diff > 80 && buffer.length > 0) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToCart]);

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        taxTotal,
        discountPercent,
        discountTotal,
        grandTotal,
        heldCarts,
        lastScannedBarcode,
        setDiscountPercent,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        holdCurrentCart,
        resumeHeldCart,
        fetchHeldCarts,
        playBeep,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
