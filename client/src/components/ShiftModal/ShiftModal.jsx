import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DollarSign, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import styles from './ShiftModal.module.css';

export default function ShiftModal({ isOpen, onClose }) {
  const { activeShift, openRegisterShift, closeRegisterShift, refreshShift, user } = useAuth();
  const [openingFloat, setOpeningFloat] = useState('150.00');
  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zReportData, setZReportData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      refreshShift();
      setError('');
      setZReportData(null);
    }
  }, [isOpen, refreshShift]);

  if (!isOpen) return null;

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await openRegisterShift(Number(openingFloat));
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to open register');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    if (!actualCash) {
      setError('Please enter physical cash counted in drawer');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await closeRegisterShift(Number(actualCash));
      setZReportData(res.zReport);
    } catch (err) {
      setError(err.message || 'Failed to close register');
    } finally {
      setLoading(false);
    }
  };

  const expectedCash = activeShift?.expectedCash || activeShift?.openingFloat || 0;
  const variance = actualCash !== '' ? Number((Number(actualCash) - expectedCash).toFixed(2)) : 0;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Register & Shift Control</h3>
            <p className={styles.subtitle}>
              Cashier: <strong>{user?.name || 'Active Cashier'}</strong>
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Z-REPORT CONFIRMATION VIEW ── */}
        {zReportData ? (
          <div className={styles.zReportView}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={48} className={styles.checkIcon} />
            </div>
            <h4 className={styles.zReportTitle}>Z-Report Summary Finalized</h4>
            <div className={styles.receiptBox}>
              <div className={styles.receiptRow}>
                <span>Shift ID:</span>
                <strong>{zReportData.shiftId?.slice(-8)}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Opening Float:</span>
                <span>${Number(zReportData.openingFloat).toFixed(2)}</span>
              </div>
              <div className={styles.receiptRow}>
                <span>Cash Sales:</span>
                <span>${Number(zReportData.cashSales).toFixed(2)}</span>
              </div>
              <div className={styles.receiptRow}>
                <span>Card Sales:</span>
                <span>${Number(zReportData.cardSales).toFixed(2)}</span>
              </div>
              <div className={styles.receiptRow}>
                <span>Total Transactions:</span>
                <span>{zReportData.totalTransactions}</span>
              </div>
              <div className={styles.receiptDivider} />
              <div className={styles.receiptRow}>
                <span>Expected Cash:</span>
                <span>${Number(zReportData.expectedCash).toFixed(2)}</span>
              </div>
              <div className={styles.receiptRow}>
                <span>Counted Cash:</span>
                <strong>${Number(zReportData.actualCountedCash).toFixed(2)}</strong>
              </div>
              <div className={`${styles.receiptRow} ${zReportData.cashVariance === 0 ? styles.balanced : styles.discrepancy}`}>
                <span>Variance:</span>
                <strong>
                  {zReportData.cashVariance >= 0 ? '+' : ''}
                  ${Number(zReportData.cashVariance).toFixed(2)} ({zReportData.varianceStatus})
                </strong>
              </div>
            </div>
            <button className={styles.primaryBtn} onClick={onClose}>
              Done & Return
            </button>
          </div>
        ) : !activeShift ? (
          /* ── OPEN REGISTER VIEW ── */
          <form onSubmit={handleOpenShift} className={styles.body}>
            <div className={styles.infoCard}>
              <Clock size={20} className={styles.infoIcon} />
              <div>
                <div className={styles.infoTitle}>Register is Currently Closed</div>
                <div className={styles.infoDesc}>Enter starting cash float to begin processing sales.</div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Opening Cash Float ($)</label>
              <div className={styles.inputWrap}>
                <DollarSign size={18} className={styles.currencyIcon} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="150.00"
                  required
                />
              </div>
            </div>

            <div className={styles.floatPresets}>
              {['50.00', '100.00', '150.00', '200.00'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => setOpeningFloat(preset)}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? 'Opening Register…' : 'Open Register Shift'}
            </button>
          </form>
        ) : (
          /* ── ACTIVE REGISTER & CLOSE SHIFT (Z-REPORT) VIEW ── */
          <form onSubmit={handleCloseShift} className={styles.body}>
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Opening Float</div>
                <div className={styles.metricValue}>${Number(activeShift.openingFloat || 0).toFixed(2)}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Shift Sales</div>
                <div className={styles.metricValue}>${Number(activeShift.totalSales || 0).toFixed(2)}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Cash in Drawer</div>
                <div className={styles.metricValue}>${Number(expectedCash).toFixed(2)}</div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Transactions</div>
                <div className={styles.metricValue}>{activeShift.totalTransactions || 0}</div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Count Physical Cash in Drawer ($)</label>
              <div className={styles.inputWrap}>
                <DollarSign size={18} className={styles.currencyIcon} />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  placeholder="Enter counted total…"
                  required
                />
              </div>
            </div>

            {actualCash !== '' && (
              <div className={`${styles.varianceBanner} ${variance === 0 ? styles.varBalanced : variance > 0 ? styles.varOver : styles.varShort}`}>
                <div>
                  <div className={styles.varTitle}>
                    {variance === 0 ? 'Cash Balanced' : variance > 0 ? 'Cash Overage' : 'Cash Shortage'}
                  </div>
                  <div className={styles.varSub}>
                    Expected: ${expectedCash.toFixed(2)} • Actual: ${Number(actualCash).toFixed(2)}
                  </div>
                </div>
                <div className={styles.varAmount}>
                  {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
                </div>
              </div>
            )}

            <button type="submit" className={styles.dangerBtn} disabled={loading}>
              {loading ? 'Closing Register…' : 'Close Shift & Finalize Z-Report'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
