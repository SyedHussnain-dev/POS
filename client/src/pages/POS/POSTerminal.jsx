import { useState, useEffect, useCallback } from 'react';
import {
  Search, ShoppingCart, Trash2, Plus, Minus, Tag,
  CreditCard, Banknote, QrCode, PauseCircle, Zap,
  Package, X, Receipt, AlertTriangle, CheckCircle2, Printer, Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import PaymentTerminal3D from '../../components/Three/PaymentTerminal3D';
import ProductViewer3D from '../../components/Three/ProductViewer3D';
import HeldCartsModal from '../../components/HeldCartsModal/HeldCartsModal';
import ShiftModal from '../../components/ShiftModal/ShiftModal';
import { generateReceiptPDF } from '../../utils/receiptHelper';
import styles from './POSTerminal.module.css';

const CATEGORIES = ['All', 'Beverages', 'Food', 'Snacks', 'Desserts', 'General'];
const PAYMENT_METHODS = [
  { id: 'CASH',    label: 'Cash',    icon: Banknote  },
  { id: 'CARD',    label: 'Card',    icon: CreditCard },
  { id: 'QR_CODE', label: 'QR Code', icon: QrCode    },
];
const QUICK_CASH = [10, 20, 50, 100, 200];

export default function POSTerminal() {
  const {
    items: cartItems, subtotal, taxTotal, discountPercent,
    discountTotal, grandTotal, heldCarts,
    addToCart, updateQty, removeFromCart, clearCart,
    setDiscountPercent, holdCurrentCart,
  } = useCart();
  const { activeShift } = useAuth();

  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [category, setCategory]           = useState('All');
  const [showPayment, setShowPayment]     = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashGiven, setCashGiven]         = useState('');
  const [splitPayments, setSplitPayments] = useState([]);
  const [processing, setProcessing]       = useState(false);
  const [successOrder, setSuccessOrder]   = useState(null);
  const [errorMsg, setErrorMsg]           = useState('');
  const [preview3D, setPreview3D]         = useState(null);
  const [showHeld, setShowHeld]           = useState(false);
  const [showShift, setShowShift]         = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  // ── Load Products ──
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { availableOnly: 'true' };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      const res = await api.get('/products', { params });
      setProducts(res.data.data || []);
    } catch (_err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Hotkeys ──
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'F2') document.getElementById('posSearch')?.focus();
      if (e.key === 'F4') handleHoldCart();
      if (e.key === 'F8' && cartItems.length > 0) setShowPayment(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cartItems.length]);

  const handleHoldCart = async () => {
    if (!cartItems.length) return;
    const ok = await holdCurrentCart('Walk-in Customer', '');
    if (ok) setShowHeld(true);
  };

  // ── Discount apply ──
  const applyDiscount = () => {
    const val = parseFloat(discountInput);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      setDiscountPercent(val);
    }
  };

  // ── Cash change ──
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashGivenNum - grandTotal).toFixed(2);

  // ── Split payment helpers ──
  const splitTotal = splitPayments.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = Math.max(0, grandTotal - splitTotal).toFixed(2);
  const addSplitLine = () => {
    setSplitPayments((prev) => [
      ...prev,
      { method: 'CASH', amount: parseFloat(splitRemaining) || 0 },
    ]);
  };

  // ── Checkout ──
  const handleCheckout = async () => {
    if (!cartItems.length) return;
    if (!activeShift) {
      setShowPayment(false);
      setShowShift(true);
      return;
    }
    setProcessing(true);
    setErrorMsg('');

    const isSplit = splitPayments.length > 0;
    let payments;

    if (isSplit) {
      payments = splitPayments.map((p) => ({ method: p.method, amount: Number(p.amount) }));
      if (Math.abs(splitTotal - grandTotal) > 0.009) {
        setErrorMsg('Split payment amounts must equal the order total.');
        return;
      }
    } else {
      payments = [{
        method: paymentMethod,
        amount: paymentMethod === 'CASH' ? cashGivenNum : grandTotal,
      }];
      if (paymentMethod === 'CASH' && cashGivenNum < grandTotal) {
        setErrorMsg('Enter the cash received before confirming payment.');
        return;
      }
    }

    const payload = {
      items: cartItems.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.qty,
        unitPrice: i.price,
        subtotal: Number((i.price * i.qty).toFixed(2)),
      })),
      subtotal,
      taxTotal,
      discountTotal,
      grandTotal,
      payments,
      changeGiven: paymentMethod === 'CASH' && !isSplit
        ? parseFloat(changeDue) || 0
        : 0,
      customer: { name: 'Walk-in Customer' },
      ...(activeShift && { shiftId: activeShift._id }),
    };

    try {
      const res = await api.post('/orders', payload);
      setSuccessOrder(res.data.data);
      clearCart();
      setShowPayment(false);
      setSplitPayments([]);
      setCashGiven('');
      fetchProducts();
      // 🎉 Confetti
      confetti({ particleCount: 120, spread: 80, origin: { x: 0.7, y: 0.5 } });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Low stock check ──
  const isLowStock = (p) =>
    p.stockQuantity <= (p.reorderLevel || 10);

  // ── Payment modal content ──
  const PaymentModal = () => (
    <div className={styles.modalOverlay}>
      <div className={styles.paymentModal}>
        <div className={styles.modalHeader}>
          <h3>Complete Payment</h3>
          <button onClick={() => { setShowPayment(false); setSplitPayments([]); }}>
            <X size={20} />
          </button>
        </div>

        {/* 3D Terminal Canvas */}
        <PaymentTerminal3D method={paymentMethod} grandTotal={grandTotal} />

        {/* Payment Method Tabs */}
        <div className={styles.methodTabs}>
          {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`${styles.methodTab} ${paymentMethod === id ? styles.methodActive : ''}`}
              onClick={() => { setPaymentMethod(id); setSplitPayments([]); }}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {/* Order Summary */}
        <div className={styles.summaryRows}>
          <div className={styles.sumRow}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discountTotal > 0 && <div className={`${styles.sumRow} ${styles.sumDiscount}`}><span>Discount ({discountPercent}%)</span><span>-${discountTotal.toFixed(2)}</span></div>}
          <div className={styles.sumRow}><span>Tax</span><span>${taxTotal.toFixed(2)}</span></div>
          <div className={`${styles.sumRow} ${styles.sumTotal}`}><span>Total</span><span>${grandTotal.toFixed(2)}</span></div>
        </div>

        {/* Cash Tendering */}
        {paymentMethod === 'CASH' && splitPayments.length === 0 && (
          <div className={styles.cashSection}>
            <label className={styles.cashLabel}>Cash Given</label>
            <input
              type="number"
              className={styles.cashInput}
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              placeholder="0.00"
              step="0.01"
              autoFocus
            />
            <div className={styles.quickCash}>
              {QUICK_CASH.map((v) => (
                <button
                  key={v}
                  className={styles.quickBtn}
                  onClick={() => setCashGiven(String(v))}
                >
                  ${v}
                </button>
              ))}
              <button
                className={styles.quickBtn}
                onClick={() => setCashGiven(grandTotal.toFixed(2))}
              >
                Exact
              </button>
            </div>
            {cashGivenNum >= grandTotal && (
              <div className={styles.changeDue}>
                Change: <strong>${changeDue}</strong>
              </div>
            )}
          </div>
        )}

        {/* Split Payments */}
        {splitPayments.length > 0 && (
          <div className={styles.splitSection}>
            <div className={styles.splitHeader}>
              <span>Split Payments</span>
              <span className={styles.splitRemaining}>
                Remaining: ${splitRemaining}
              </span>
            </div>
            {splitPayments.map((p, idx) => (
              <div key={idx} className={styles.splitRow}>
                <select
                  className={styles.splitMethod}
                  value={p.method}
                  onChange={(e) => {
                    const copy = [...splitPayments];
                    copy[idx].method = e.target.value;
                    setSplitPayments(copy);
                  }}
                >
                  {PAYMENT_METHODS.map(({ id, label }) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className={styles.splitAmount}
                  value={p.amount}
                  step="0.01"
                  onChange={(e) => {
                    const copy = [...splitPayments];
                    copy[idx].amount = parseFloat(e.target.value) || 0;
                    setSplitPayments(copy);
                  }}
                />
                <button onClick={() => setSplitPayments((prev) => prev.filter((_, i) => i !== idx))}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className={styles.addSplitBtn} onClick={addSplitLine}>+ Add Payment Line</button>
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorMsg}><AlertTriangle size={14} /> {errorMsg}</div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.splitTrigger} onClick={addSplitLine}>
            Split Payment
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleCheckout}
            disabled={processing || (paymentMethod === 'CASH' && splitPayments.length === 0 && cashGivenNum < grandTotal)}
          >
            {processing ? 'Processing…' : `Confirm $${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Success Receipt Overlay ──
  const SuccessOverlay = () => (
    <div className={styles.successOverlay}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}><CheckCircle2 size={56} /></div>
        <h3 className={styles.successTitle}>Payment Complete!</h3>
        <div className={styles.successAmount}>${Number(successOrder?.grandTotal || 0).toFixed(2)}</div>
        <div className={styles.successId}>{successOrder?.orderNumber}</div>
        <div className={styles.successMeta}>
          <span>Method: {successOrder?.payments?.[0]?.method}</span>
          {successOrder?.changeGiven > 0 && (
            <span>Change: ${Number(successOrder.changeGiven).toFixed(2)}</span>
          )}
        </div>
        <button
          className={styles.newSaleBtn}
          onClick={() => setSuccessOrder(null)}
        >
          New Sale
        </button>
        <div className={styles.receiptActions}>
          <button onClick={() => generateReceiptPDF(successOrder, 'print')}>
            <Printer size={15} /> Print receipt
          </button>
          <button onClick={() => generateReceiptPDF(successOrder)}>
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.terminal}>
      {showPayment && <PaymentModal />}
      {successOrder && <SuccessOverlay />}
      {preview3D && (
        <ProductViewer3D product={preview3D} onClose={() => setPreview3D(null)} />
      )}
      <HeldCartsModal isOpen={showHeld} onClose={() => setShowHeld(false)} />
      <ShiftModal isOpen={showShift} onClose={() => setShowShift(false)} />

      {/* ── LEFT: Product Grid ── */}
      <div className={styles.leftPanel}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              id="posSearch"
              type="text"
              className={styles.searchInput}
              placeholder="Search products or scan barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.toolbarActions}>
            <button
              className={styles.toolBtn}
              onClick={() => setShowShift(true)}
              title="Register / Shift Management"
            >
              <Receipt size={16} />
              <span className={`${styles.shiftDot} ${activeShift ? styles.dotOpen : styles.dotClosed}`} />
            </button>
            <button
              className={styles.toolBtn}
              onClick={() => setShowHeld(true)}
              title="Held Carts (F4)"
            >
              <PauseCircle size={16} />
              {heldCarts.length > 0 && <span className={styles.heldBadge}>{heldCarts.length}</span>}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className={styles.categoryBar}>
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

        {/* Product Grid */}
        {loading ? (
          <div className={styles.loadingGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skelCard} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={40} />
            <p>No products found</p>
          </div>
        ) : (
          <div className={styles.productGrid}>
            {products.map((product) => (
              <div key={product._id} className={styles.productCard}>
                {product.imageUrl && (
                  <button
                    className={styles.productImgWrap}
                    onClick={() => setPreview3D(product)}
                    title="3D Preview"
                  >
                    <img src={product.imageUrl} alt={product.name} className={styles.productImg} />
                    <div className={styles.imgOverlay}>View 3D</div>
                  </button>
                )}
                <div className={styles.productInfo}>
                  <div className={styles.productName}>{product.name}</div>
                  <div className={styles.productMeta}>
                    <span className={styles.productSku}>{product.sku}</span>
                    {isLowStock(product) && (
                      <span className={styles.lowStockBadge}>Low Stock</span>
                    )}
                  </div>
                  <div className={styles.productPrice}>${product.sellingPrice.toFixed(2)}</div>
                  <div className={styles.stockRow}>
                    <span className={styles.stockQty}>{product.stockQuantity} left</span>
                    {product.taxRate > 0 && (
                      <span className={styles.taxBadge}>{product.taxRate}% tax</span>
                    )}
                  </div>
                </div>
                <button
                  className={styles.addBtn}
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity <= 0}
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Cart Panel ── */}
      <div className={styles.cartPanel}>
        {/* Cart Header */}
        <div className={styles.cartHeader}>
          <div className={styles.cartTitle}>
            <ShoppingCart size={20} />
            <span>Cart</span>
            {cartItems.length > 0 && (
              <span className={styles.cartCount}>{cartItems.reduce((s, i) => s + i.qty, 0)}</span>
            )}
          </div>
          {cartItems.length > 0 && (
            <div className={styles.cartHeaderActions}>
              <button
                className={styles.holdBtn}
                onClick={handleHoldCart}
                title="Hold Cart (F4)"
              >
                <PauseCircle size={15} />
                Hold
              </button>
              <button className={styles.clearBtn} onClick={clearCart} title="Clear cart">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className={styles.cartItems}>
          {cartItems.length === 0 ? (
            <div className={styles.cartEmpty}>
              <ShoppingCart size={36} className={styles.cartEmptyIcon} />
              <p>Add products to get started</p>
              <p className={styles.cartEmptyHint}>Press F2 to search or scan barcode</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.productId} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemPrice}>
                    ${item.price.toFixed(2)} each
                  </div>
                </div>
                <div className={styles.cartQtyControl}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.productId, item.qty - 1)}
                  >
                    <Minus size={13} />
                  </button>
                  <span className={styles.qtyNum}>{item.qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => updateQty(item.productId, item.qty + 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>
                <div className={styles.cartItemTotal}>
                  ${(item.price * item.qty).toFixed(2)}
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeFromCart(item.productId)}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Discount Row */}
        {cartItems.length > 0 && (
          <div className={styles.discountRow}>
            <Tag size={14} className={styles.discountIcon} />
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className={styles.discountInput}
              placeholder="Discount %"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
            />
            <button className={styles.discountApplyBtn} onClick={applyDiscount}>
              Apply
            </button>
            {discountPercent > 0 && (
              <button
                className={styles.discountClearBtn}
                onClick={() => { setDiscountPercent(0); setDiscountInput(''); }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Totals */}
        {cartItems.length > 0 && (
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {discountTotal > 0 && (
              <div className={`${styles.totalRow} ${styles.discountRow2}`}>
                <span>Discount ({discountPercent}%)</span>
                <span>-${discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>Tax</span><span>${taxTotal.toFixed(2)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandRow}`}>
              <span>Grand Total</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          className={styles.checkoutBtn}
          disabled={cartItems.length === 0}
          onClick={() => activeShift ? setShowPayment(true) : setShowShift(true)}
          title="Checkout (F8)"
        >
          <Zap size={18} />
          {cartItems.length > 0 ? `Checkout · $${grandTotal.toFixed(2)}` : 'Add items to checkout'}
        </button>

        {/* Hotkey hints */}
        <div className={styles.hotkeyHints}>
          <span><kbd>F2</kbd> Search</span>
          <span><kbd>F4</kbd> Hold</span>
          <span><kbd>F8</kbd> Checkout</span>
          <span><kbd>Esc</kbd> Lock</span>
        </div>
      </div>
    </div>
  );
}
