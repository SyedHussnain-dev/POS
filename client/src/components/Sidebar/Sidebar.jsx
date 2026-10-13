import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, FileText,
  Store, ChevronLeft, ChevronRight,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { usePos } from '../../context/PosContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/pos',       label: 'POS Terminal', icon: ShoppingCart },
  { to: '/items',     label: 'Inventory',    icon: Package },
  { to: '/receipts',  label: 'Receipts',     icon: FileText },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = usePos();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <div className={styles.logoMark}>
          <Store size={20} />
        </div>
        {!collapsed && <span className={styles.brandText}>RestroBit</span>}
      </div>

      {!collapsed && user && (
        <div className={styles.profile}>
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className={styles.profileAvatar} /> : <span className={styles.profileFallback}>{user.name?.[0]}</span>}
          <span><strong>{user.name}</strong><small>{user.email}</small></span>
        </div>
      )}

      <nav className={styles.nav}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <div className={styles.linkIcon}><Icon size={20} /></div>
            {!collapsed && <span className={styles.linkLabel}>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        className={styles.collapseBtn}
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
