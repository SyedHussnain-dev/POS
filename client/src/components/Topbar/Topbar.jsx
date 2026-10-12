import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import styles from './Topbar.module.css';

// ── Route → Title Map ──
const routeTitles = {
  '/dashboard': 'Dashboard',
  '/pos': 'POS Terminal',
  '/items': 'Items',
  '/receipts': 'Receipts',
};

function Topbar() {
  const location = useLocation();
  const [dateTime, setDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const basePath = '/' + location.pathname.split('/')[1];
  const title = routeTitles[basePath] || 'POS System';

  const formattedDate = dateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className={styles.topbar}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.right}>
        <span className={styles.dateTime}>
          {formattedDate} · {formattedTime}
        </span>

        <button className={styles.iconBtn} aria-label="Notifications">
          <Bell size={20} />
        </button>

        <div className={styles.avatar}>
          <User size={18} />
        </div>
      </div>
    </header>
  );
}

export default Topbar;

