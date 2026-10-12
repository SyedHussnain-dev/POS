import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock, Clock3, LogOut, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Topbar.module.css';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/pos':       'POS Terminal',
  '/items':     'Inventory',
  '/receipts':  'Receipts',
};

export default function Topbar() {
  const location = useLocation();
  const { user, activeShift, setIsLocked, logout } = useAuth();
  const [dateTime, setDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const basePath = '/' + location.pathname.split('/')[1];
  const title = routeTitles[basePath] || 'POS System';

  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        {/* Shift status indicator */}
        {activeShift ? (
          <div className={styles.shiftBadge}>
            <span className={styles.shiftDot} />
            <span>Register Open</span>
          </div>
        ) : (
          <div className={styles.shiftBadgeWarning}>
            <TriangleAlert size={13} />
            <span>No Active Shift</span>
          </div>
        )}

        <div className={styles.dateTime}>
          <Clock3 size={14} />
          <span>{formattedDate} · {formattedTime}</span>
        </div>

        {/* User avatar and info */}
        {user && (
          <div className={styles.userInfo}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.userText}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userRole}>{user.role.replace('_', ' ')}</span>
            </div>
          </div>
        )}

        {/* Lock terminal */}
        <button
          className={styles.iconBtn}
          onClick={() => setIsLocked(true)}
          title="Lock Terminal (Esc)"
        >
          <Lock size={17} />
        </button>

        {/* Logout */}
        <button
          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
          onClick={logout}
          title="Sign out"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
