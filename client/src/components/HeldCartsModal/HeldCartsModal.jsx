import { useCart } from '../../context/CartContext';
import { PauseCircle, ArrowRight, ShoppingBag } from 'lucide-react';
import styles from './HeldCartsModal.module.css';

export default function HeldCartsModal({ isOpen, onClose }) {
  const { heldCarts, resumeHeldCart } = useCart();

  if (!isOpen) return null;

  const handleResume = async (cart) => {
    await resumeHeldCart(cart);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <PauseCircle size={22} className={styles.titleIcon} />
            <div>
              <h3 className={styles.title}>Held Carts ({heldCarts.length})</h3>
              <p className={styles.subtitle}>Resume or discard paused customer transactions</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {heldCarts.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={40} className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>No carts on hold</div>
              <div className={styles.emptyDesc}>
                Press "Hold Cart" (or F4) during checkout to pause an order.
              </div>
            </div>
          ) : (
            <div className={styles.cartList}>
              {heldCarts.map((cart) => (
                <div key={cart._id} className={styles.cartCard}>
                  <div className={styles.cardTop}>
                    <div>
                      <span className={styles.orderNumber}>{cart.orderNumber}</span>
                      <h4 className={styles.customerName}>
                        {cart.customer?.name || 'Walk-in Customer'}
                      </h4>
                    </div>
                    <div className={styles.amount}>
                      ${Number(cart.grandTotal || 0).toFixed(2)}
                    </div>
                  </div>

                  <div className={styles.itemsSummary}>
                    {cart.items?.map((item, idx) => (
                      <span key={idx} className={styles.itemTag}>
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>

                  {cart.holdNote && (
                    <div className={styles.note}>“{cart.holdNote}”</div>
                  )}

                  <div className={styles.cardActions}>
                    <button
                      className={styles.resumeBtn}
                      onClick={() => handleResume(cart)}
                    >
                      <span>Resume Cart</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
