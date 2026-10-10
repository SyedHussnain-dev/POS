import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

function SearchBar({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className={styles.wrapper}>
      <Search size={18} className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export default SearchBar;
