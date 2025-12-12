import React, { useMemo, useState, useEffect } from 'react';
import {
  getShoppingList,
  addShoppingItem,
  removeShoppingItem,
  togglePurchased,
  clearPurchased,
  updateShoppingItem,
} from '../data/shoppingList';
import './shopping.css';

function Badge({ children }) {
  return (
    <span
      style={{
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        marginLeft: 8,
      }}
    >
      {children}
    </span>
  );
}

export default function ShoppingListPage() {
  const [items, setItems] = useState([]);
  const [groupByRecipe, setGroupByRecipe] = useState(false);

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    setItems(getShoppingList());
  }, []);

  // sync changes from other tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'app_shopping_list') {
        setItems(getShoppingList());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const purchasedCount = items.filter((i) => i.purchased).length;

  const groups = useMemo(() => {
    if (!groupByRecipe) return { All: items };
    const map = new Map();
    for (const it of items) {
      const key = it.recipeId ? `Recipe #${it.recipeId}` : 'Custom';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(it);
    }
    return Object.fromEntries(map.entries());
  }, [items, groupByRecipe]);

  const onAdd = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    addShoppingItem({ name: n, quantity, unit });
    setItems(getShoppingList());
    setName('');
    setQuantity('');
    setUnit('');
  };

  const onToggle = (id) => {
    togglePurchased(id);
    setItems(getShoppingList());
  };

  const onDelete = (id) => {
    removeShoppingItem(id);
    setItems(getShoppingList());
  };

  const onClearPurchased = () => {
    clearPurchased();
    setItems(getShoppingList());
  };

  const onInlineChange = (id, field, value) => {
    updateShoppingItem(id, { [field]: value });
    setItems(getShoppingList());
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Shopping List</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setGroupByRecipe((v) => !v)}
            aria-pressed={groupByRecipe}
          >
            {groupByRecipe ? 'Ungroup' : 'Group by Recipe'}
          </button>
          <button
            className="btn-danger"
            onClick={onClearPurchased}
            disabled={purchasedCount === 0}
            title="Remove purchased items"
          >
            Clear purchased {purchasedCount > 0 && <Badge>{purchasedCount}</Badge>}
          </button>
        </div>
      </header>

      <section className="card">
        <form onSubmit={onAdd} className="add-form" aria-label="Add custom item form">
          <input
            className="input"
            placeholder="Item name (e.g., Tomatoes)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Item name"
          />
          <input
            className="input"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-label="Quantity"
          />
          <input
            className="input"
            placeholder="Unit (e.g., pcs, g, ml)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Unit"
          />
          <button className="btn-primary" type="submit">
            Add Item
          </button>
        </form>
      </section>

      <div className="groups">
        {Object.entries(groups).map(([group, list]) => (
          <section key={group} className="card">
            <div className="group-header">
              <h2>{group}</h2>
              <span className="meta">{list.length} items</span>
            </div>
            <ul className="item-list">
              {list.map((it) => (
                <li key={it.id} className={`item ${it.purchased ? 'purchased' : ''}`}>
                  <label className="item-left">
                    <input
                      type="checkbox"
                      checked={!!it.purchased}
                      onChange={() => onToggle(it.id)}
                      aria-label={`Mark ${it.name} as purchased`}
                    />
                  </label>
                  <div className="item-main">
                    <input
                      className="input-inline name"
                      value={it.name}
                      onChange={(e) => onInlineChange(it.id, 'name', e.target.value)}
                      aria-label="Item name"
                    />
                    <div className="meta-row">
                      <input
                        className="input-inline small"
                        value={it.quantity || ''}
                        onChange={(e) => onInlineChange(it.id, 'quantity', e.target.value)}
                        placeholder="Qty"
                        aria-label="Quantity"
                      />
                      <input
                        className="input-inline small"
                        value={it.unit || ''}
                        onChange={(e) => onInlineChange(it.id, 'unit', e.target.value)}
                        placeholder="Unit"
                        aria-label="Unit"
                      />
                      {it.recipeId && <Badge>from recipe</Badge>}
                    </div>
                  </div>
                  <div className="item-right">
                    <button className="btn-link danger" onClick={() => onDelete(it.id)} aria-label="Delete item">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {list.length === 0 && <li className="empty">No items</li>}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
