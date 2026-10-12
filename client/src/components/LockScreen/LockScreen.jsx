import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock, ShieldAlert, UserCheck } from 'lucide-react';
import styles from './LockScreen.module.css';

export default function LockScreen() {
  const { isLocked, setIsLocked, pinSwitch, user } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = async (enteredPin) => {
    setLoading(true);
    try {
      await pinSwitch(enteredPin);
      setPin('');
      setError('');
      setIsLocked(false);
    } catch (err) {
      setError(err.message || 'Invalid PIN code');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          <Lock size={36} className={styles.lockIcon} />
        </div>

        <h2 className={styles.title}>Terminal Locked</h2>
        <p className={styles.subtitle}>
          Enter 4-digit PIN to unlock or switch cashier
        </p>

        {user && (
          <div className={styles.currentUserBadge}>
            <span className={styles.statusDot} />
            Current: <strong>{user.name}</strong>
          </div>
        )}

        {/* PIN Dots */}
        <div className={styles.dots}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`${styles.dot} ${pin.length > idx ? styles.dotFilled : ''}`}
            />
          ))}
        </div>

        {error && (
          <div className={styles.error}>
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className={styles.key}
              onClick={() => handleDigit(String(num))}
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.key} ${styles.keySecondary}`}
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            type="button"
            className={styles.key}
            onClick={() => handleDigit('0')}
            disabled={loading}
          >
            0
          </button>
          <button
            type="button"
            className={`${styles.key} ${styles.keyAction}`}
            onClick={() => verifyPin(pin)}
            disabled={loading || pin.length !== 4}
          >
            <Unlock size={20} />
          </button>
        </div>

        {/* Fast Switch Demo Helpers */}
        <div className={styles.quickPins}>
          <div className={styles.quickPinsTitle}>
            <UserCheck size={12} />
            <span>Demo Staff PINs:</span>
          </div>
          <div className={styles.pinPills}>
            <button
              type="button"
              className={styles.pill}
              onClick={() => {
                setPin('3333');
                verifyPin('3333');
              }}
            >
              Cashier Alex (3333)
            </button>
            <button
              type="button"
              className={styles.pill}
              onClick={() => {
                setPin('2222');
                verifyPin('2222');
              }}
            >
              Manager (2222)
            </button>
            <button
              type="button"
              className={styles.pill}
              onClick={() => {
                setPin('1111');
                verifyPin('1111');
              }}
            >
              Admin (1111)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
