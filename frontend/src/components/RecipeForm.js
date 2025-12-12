import React, { useEffect, useMemo, useState } from 'react';

const CATEGORIES = ['Veg', 'Non-Veg', 'Desserts', 'Drinks'];

/**
 * PUBLIC_INTERFACE
 * RecipeForm renders a form for creating or editing a recipe.
 * Props:
 * - initial: recipe object or null for create
 * - onCancel: () => void
 * - onSave: (recipeDraft) => void  // recipeDraft has fields ready to save
 */
const RecipeForm = ({ initial = null, onCancel = () => {}, onSave = () => {} }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [image, setImage] = useState(initial?.image || '');
  const [ingredientsText, setIngredientsText] = useState(
    Array.isArray(initial?.ingredients) ? initial.ingredients.join('\n') : ''
  );
  const [stepsText, setStepsText] = useState(
    Array.isArray(initial?.steps) ? initial.steps.join('\n') : ''
  );
  const [category, setCategory] = useState(initial?.category || 'Veg');
  const [tagsText, setTagsText] = useState(Array.isArray(initial?.tags) ? initial.tags.join(', ') : '');
  const [error, setError] = useState('');

  useEffect(() => {
    // Ensure category required and valid
    if (!CATEGORIES.includes(category)) {
      setCategory('Veg');
    }
  }, [category]);

  const canSave = useMemo(() => {
    return title.trim().length > 0 && CATEGORIES.includes(category);
  }, [title, category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSave) {
      setError('Please provide a title and select a category.');
      return;
    }
    const ingredients = ingredientsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const steps = stepsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const draft = {
      ...(initial || {}),
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      ingredients,
      steps,
      tags,
      category,
    };
    onSave(draft);
  };

  const fieldWrap = {
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  const inputStyle = {
    border: '1px solid var(--ocean-border)',
    background: 'var(--ocean-surface)',
    color: 'var(--ocean-text)',
    borderRadius: 10,
    padding: '10px 12px',
    outline: 'none',
  };

  const labelStyle = { fontWeight: 700, fontSize: 13 };

  const selectBtn = (opt) => ({
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid var(--ocean-border)',
    background: category === opt ? 'rgba(37,99,235,0.10)' : 'var(--ocean-surface)',
    borderColor: category === opt ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : 'var(--ocean-border)',
    cursor: 'pointer',
  });

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      {error && (
        <div className="alert alert-warn" role="alert">
          {error}
        </div>
      )}
      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="rf-title">Title/Name</label>
        <input
          id="rf-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
          placeholder="e.g., Classic Margherita Pizza"
          required
          autoFocus
        />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="rf-description">Description</label>
        <textarea
          id="rf-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          placeholder="Short description..."
        />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="rf-image">Image URL</label>
        <input
          id="rf-image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="rf-ingredients">Ingredients (one per line)</label>
        <textarea
          id="rf-ingredients"
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
          placeholder="2 cups flour
1 tsp salt
..."
        />
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="rf-steps">Steps (one per line)</label>
        <textarea
          id="rf-steps"
          value={stepsText}
          onChange={(e) => setStepsText(e.target.value)}
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
          placeholder="Preheat oven to 220C
Mix ingredients
..."
        />
      </div>

      <div style={fieldWrap}>
        <div style={labelStyle}>Category (required)</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CATEGORIES.map((opt) => (
            <button type="button" key={opt} onClick={() => setCategory(opt)} className="theme-toggle" style={selectBtn(opt)} aria-pressed={category === opt}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={fieldWrap}>
        <label style={labelStyle} htmlFor="rf-tags">Tags (comma separated)</label>
        <input
          id="rf-tags"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          style={inputStyle}
          placeholder="pizza, basil, vegetarian"
        />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" className="theme-toggle" onClick={onCancel}>Cancel</button>
        <button type="submit" className="theme-toggle" style={{ background: 'rgba(37,99,235,0.10)' }} disabled={!canSave}>
          {initial ? 'Save Changes' : 'Add Recipe'}
        </button>
      </div>
    </form>
  );
};

export default RecipeForm;
