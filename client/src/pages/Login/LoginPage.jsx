import { useState } from 'react';
import { LockKeyhole, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePos } from '../../context/PosContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = usePos();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.icon}><LockKeyhole size={24} /></div>
        <p className={styles.eyebrow}>RESTROBIT POS</p>
        <h1>Sign in</h1>
        <p className={styles.subtitle}>Enter your username and password to continue.</p>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={loading}>
          <LogIn size={17} /> {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
