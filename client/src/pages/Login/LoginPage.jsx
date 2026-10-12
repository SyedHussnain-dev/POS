import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Store, Eye, EyeOff, Loader } from 'lucide-react';
import styles from './LoginPage.module.css';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@pos.com', password: 'AdminPassword123!', role: 'SUPER_ADMIN' },
  { label: 'Manager', email: 'manager@pos.com', password: 'ManagerPassword123!', role: 'STORE_MANAGER' },
  { label: 'Cashier', email: 'cashier@pos.com', password: 'CashierPassword123!', role: 'CASHIER' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className={styles.page}>
      {/* Ambient orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.logoWrap}>
            <Store size={28} />
          </div>
          <div>
            <h1 className={styles.brandName}>POS System</h1>
            <p className={styles.brandSub}>Enterprise Point of Sale</p>
          </div>
        </div>

        <h2 className={styles.heading}>Welcome Back</h2>
        <p className={styles.subheading}>Sign in to access your register</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passwordWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <><Loader size={18} className={styles.spinner} /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className={styles.divider}><span>Quick Demo Access</span></div>

        <div className={styles.demoGrid}>
          {DEMO_ACCOUNTS.map((a) => (
            <button key={a.role} className={styles.demoBtn} onClick={() => fillDemo(a)}>
              <span className={styles.demoRole}>{a.label}</span>
              <span className={styles.demoEmail}>{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
