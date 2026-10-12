import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout() {
  const { setIsLocked } = useAuth();

  // ── Escape key locks terminal ──
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setIsLocked(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setIsLocked]);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <Topbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
