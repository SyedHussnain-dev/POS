import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../../api/axios';
import DataTable from '../../components/DataTable/DataTable';
import SearchBar from '../../components/SearchBar/SearchBar';
import Modal from '../../components/Modal/Modal';
import styles from './Items.module.css';

const CATEGORIES = ['All', 'Beverages', 'Food', 'Snacks', 'Desserts', 'General'];

const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'price',
    label: 'Price',
    render: (val) => `$${Number(val).toFixed(2)}`,
  },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock' },
  {
    key: 'barcode',
    label: 'Barcode',
    render: (val) => val || '—',
  },
];

const emptyForm = { name: '', price: '', category: 'General', stock: '', barcode: '' };

function Items() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category;

    api
      .get('/items', { params })
      .then((res) => setItems(res.data.data))
      .catch((err) => console.error('Fetch items error:', err))
      .finally(() => setLoading(false));
  }, [search, category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      stock: item.stock,
      barcode: item.barcode || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await api.delete(`/items/${item._id}`);
      fetchItems();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editing) {
        await api.put(`/items/${editing._id}`, payload);
      } else {
        await api.post('/items', payload);
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search items…"
        />

        <div className={styles.filters}>
          <select
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button className={styles.addBtn} onClick={openCreate}>
            <Plus size={18} />
            Add Item
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <Modal
          title={editing ? 'Edit Item' : 'New Item'}
          onClose={() => setShowModal(false)}
        >
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                required
              />
            </label>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange('price')}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Stock</span>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange('stock')}
                  required
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.field}>
                <span>Category</span>
                <select value={form.category} onChange={handleChange('category')}>
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Barcode</span>
                <input
                  type="text"
                  value={form.barcode}
                  onChange={handleChange('barcode')}
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={saving}
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Items;
