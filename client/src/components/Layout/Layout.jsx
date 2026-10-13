import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';
import { usePos } from '../../context/PosContext';
import styles from './Layout.module.css';

export default function Layout() {
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
