import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, Banknote, X, Printer, Download } from 'lucide-react';
import api from '../../api/axios';
import { generateReceiptPDF } from '../../utils/receiptHelper';
import SearchBar from '../../components/SearchBar/SearchBar';
import styles from './POSTerminal.module.css';

const CATEGORIES = ['All', 'Beverages', 'Food', 'Snacks', 'Desserts', 'General'];

function POSTerminal() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category;

    api
      .get('/items', { params })
      .then((res) => setItems(res.data.data))
      .catch((err) => console.error('Fetch items error:', err))
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Cart Helpers ──
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return prev.map((c) =>
          c._id === item._id ? { ...c, qty: c.qty + 1 } : c,
        );
      }
      if (item.stock < 1) return prev;
      return [...prev, { _id: item._id, name: item.name, price: item.price, qty: 1, stock: item.stock }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c._id !== id) return c;
          const newQty = c.qty + delta;
          if (newQty > c.stock) return c;
          return { ...c, qty: newQty };
        })
        .filter((c) => c.qty > 0),
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((c) => c._id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('cash');
  };

  // ── Totals ──
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const discountAmount = (subtotal * discount) / 100;
  const taxRate = 0.08;
  const taxable = subtotal - discountAmount;
  const tax = taxable * taxRate;
  const grandTotal = taxable + tax;

  // ── Checkout ──
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);

    const payload = {
      items: cart.map((c) => ({
        item: c._id,
        name: c.name,
        qty: c.qty,
        price: c.price,
        total: c.price * c.qty,
      })),
      subtotal,
      tax: Number(tax.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      paymentMethod,
    };

    try {
      const res = await api.post('/receipts', payload);
      setSuccess(res.data.data);
      clearCart();
      fetchItems();
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.terminal}>
      {/* ── Left: Item Grid ── */}
      <div className={styles.itemsPanel}>
        <div className={styles.itemsToolbar}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search items…"
          />
          <div className={styles.categoryTabs}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`${styles.catTab} ${category === c ? styles.catActive : ''}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={styles.itemGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.itemSkeleton} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyItems}>
            <p>No items found</p>
          </div>
        ) : (
          <div className={styles.itemGrid}>
            {items.map((item) => (
              <button
                key={item._id}
                className={styles.itemCard}
                onClick={() => addToCart(item)}
                disabled={item.stock < 1}
              >
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemPrice}>
                  ${item.price.toFixed(2)}
                </span>
                <span className={styles.itemStock}>
                  {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: Cart ── */}
      <div className={styles.cartPanel}>
        <div className={styles.cartHeader}>
          <div className={styles.cartTitle}>
            <ShoppingCart size={20} />
            <h2>Cart</h2>
            {cart.length > 0 && (
              <span className={styles.cartCount}>{cart.length}</span>
            )}
          </div>
          {cart.length > 0 && (
            <button className={styles.clearBtn} onClick={clearCart}>
              Clear
            </button>
          )}
        </div>

        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <div className={styles.emptyCart}>
              <ShoppingCart size={40} />
              <p>Cart is empty</p>
              <span>Tap items to add them</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <span className={styles.cartItemName}>{item.name}</span>
                  <span className={styles.cartItemPrice}>
                    ${(item.price * item.qty).toFixed(2)}
                  </span>
                </div>
                <div className={styles.cartItemActions}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item._id, -1)}
                  >
                    <Minus size={14} />
                  </button>
                  <span className={styles.qty}>{item.qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item._id, 1)}
                    disabled={item.qty >= item.stock}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeFromCart(item._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Cart Footer ── */}
        <div className={styles.cartFooter}>
          <label className={styles.selectField}>
            <span>Discount %</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
          </label>

          <div className={styles.paymentToggle}>
            <button
              className={`${styles.payBtn} ${paymentMethod === 'cash' ? styles.payActive : ''}`}
              onClick={() => setPaymentMethod('cash')}
            >
              <Banknote size={18} />
              Cash
            </button>
            <button
              className={`${styles.payBtn} ${paymentMethod === 'card' ? styles.payActive : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <CreditCard size={18} />
              Card
            </button>
          </div>

          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className={styles.totalRow}>
                <span>Discount ({discount}%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            className={styles.checkoutBtn}
            disabled={cart.length === 0 || processing}
            onClick={handleCheckout}
          >
            {processing ? 'Processing…' : `Charge $${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>

      {/* ── Success Overlay ── */}
      {success && (
        <div className={styles.overlay}>
          <div className={styles.successCard}>
            <button
              className={styles.successClose}
              onClick={() => setSuccess(null)}
            >
              <X size={20} />
            </button>
            <div className={styles.successIcon}>✓</div>
            <h3>Payment Successful</h3>
            <p className={styles.successReceipt}>
              Receipt: {success.receiptNumber}
            </p>
            <p className={styles.successAmount}>
              ${success.grandTotal.toFixed(2)}
            </p>
            <div className={styles.successActions}>
              <button
                className={styles.actionBtn}
                onClick={() => generateReceiptPDF(success, 'print')}
              >
                <Printer size={18} />
                Print
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => generateReceiptPDF(success, 'download')}
              >
                <Download size={18} />
                PDF
              </button>
            </div>
            <button
              className={styles.successDone}
              onClick={() => setSuccess(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default POSTerminal;
