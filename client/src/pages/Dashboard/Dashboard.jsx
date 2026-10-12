import { useEffect, useState } from 'react';
import { DollarSign, Package, FileText, Users } from 'lucide-react';
import api from '../../api/axios';
import KPICard from '../../components/KPICard/KPICard';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/orders/stats')
      .then((res) => setStats(res.data.data))
      .catch((err) => console.error('Dashboard fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.kpiGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.kpiSkeleton}>
              <div className={styles.skelCircle} />
              <div className={styles.skelLines}>
                <div className={styles.skelLine} style={{ width: '60%' }} />
                <div className={styles.skelLine} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <p>Unable to load dashboard data. Make sure the server is running.</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      icon: DollarSign,
      label: "Today's Sales",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      color: 'var(--color-success)',
    },
    {
      icon: Package,
      label: 'Items Sold',
      value: stats.totalProductsSold,
      color: 'var(--color-primary)',
    },
    {
      icon: Users,
      label: 'Customers Served',
      value: stats.todayOrdersCount,
      color: 'var(--color-warning)',
    },
    {
      icon: FileText,
      label: 'All Orders',
      value: stats.totalOrdersCount,
      color: 'var(--color-border)',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      <section className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Recent Transactions</h2>

        {stats.recentOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No transactions yet. Create one from the POS Terminal.</p>
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
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((r) => (
                  <tr key={r._id}>
                    <td className={styles.mono}>{r.orderNumber}</td>
                    <td>{r.items?.length || 0}</td>
                    <td className={styles.amount}>
                      ${r.grandTotal.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={styles.badge}
                        data-method={r.payments?.[0]?.method}
                      >
                        {r.payments?.map((payment) => payment.method).join(' + ') || 'N/A'}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
