import styles from './KPICard.module.css';

function KPICard({ icon: Icon, label, value, trend, color = 'var(--color-primary)' }) {
  return (
    <div className={styles.card}>
      <div className={styles.iconWrap} style={{ background: `${color}18` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {trend !== undefined && (
          <span
            className={styles.trend}
            data-positive={trend >= 0 ? '' : undefined}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default KPICard;

