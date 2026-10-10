import { useEffect, useState } from 'react';
import { Eye, Printer, Download } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/Modal/Modal';
import { generateReceiptPDF } from '../../utils/receiptHelper';
import styles from './Receipts.module.css';

function Receipts() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    api
      .get('/receipts')
      .then((res) => setReceipts(res.data.data))
      .catch((err) => console.error('Fetch receipts error:', err))
      .finally(() => setLoading(false));
  }, []);

  const viewReceipt = async (receipt) => {
    setDetailLoading(true);
    setSelected(receipt);
    try {
      const res = await api.get(`/receipts/${receipt._id}`);
      setSelected(res.data.data);
    } catch (err) {
      console.error('Fetch receipt detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}>
                      <div className={styles.skeleton} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {receipts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No receipts yet. Process a sale from the POS Terminal.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr key={r._id}>
                  <td className={styles.mono}>{r.receiptNumber}</td>
                  <td>{r.items?.length || 0}</td>
                  <td className={styles.amount}>
                    ${r.grandTotal.toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={styles.badge}
                      data-method={r.paymentMethod}
                    >
                      {r.paymentMethod}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(r.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => viewReceipt(r)}
                      aria-label="View receipt"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <Modal
          title={`Receipt ${selected.receiptNumber}`}
          onClose={() => setSelected(null)}
        >
          {detailLoading ? (
            <div className={styles.detailLoading}>Loading…</div>
          ) : (
            <div className={styles.receiptDetail}>
              <div className={styles.detailMeta}>
                <div>
                  <span className={styles.detailLabel}>Date</span>
                  <span>
                    {new Date(selected.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div>
                  <span className={styles.detailLabel}>Payment</span>
                  <span className={styles.capitalize}>
                    {selected.paymentMethod}
                  </span>
                </div>
              </div>

              <table className={styles.detailTable}>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>{item.qty}</td>
                      <td>${item.price.toFixed(2)}</td>
                      <td>${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.detailTotals}>
                <div className={styles.detailRow}>
                  <span>Subtotal</span>
                  <span>${selected.subtotal.toFixed(2)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className={styles.detailRow}>
                    <span>Discount</span>
                    <span>-${selected.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span>Tax</span>
                  <span>${selected.tax.toFixed(2)}</span>
                </div>
                <div className={`${styles.detailRow} ${styles.detailGrand}`}>
                  <span>Grand Total</span>
                  <span>${selected.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.receiptActions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => generateReceiptPDF(selected, 'print')}
                >
                  <Printer size={16} />
                  Print
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => generateReceiptPDF(selected, 'download')}
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export default Receipts;
