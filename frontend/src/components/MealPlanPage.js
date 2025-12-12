import React, { useEffect, useMemo, useState } from 'react';
import { DAYS, getWeekStartMondayISO, loadMealPlanForWeek, saveMealPlanForWeek, addRecipeToDay, removeRecipeFromDay, clearDay, aggregateIngredientsFromRecipes } from '../data/mealPlan';
import { addShoppingItem } from '../data/shoppingList';
import './planning.css';

const dayLabels = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

function SmallRecipeRow({ entry, onRemove }) {
  return (
    <div className="recipe-row">
      <div className="recipe-text">
        <div className="title">{entry.title}</div>
        <div className="meta">
          {entry.category && <span className="chip">{entry.category}</span>}
          {entry.cookingTime && <span className="chip">{entry.cookingTime}</span>}
          {entry.difficulty && <span className="chip">{entry.difficulty}</span>}
        </div>
      </div>
      <button className="btn-link danger" onClick={onRemove} aria-label="Remove from day">
        Remove
      </button>
    </div>
  );
}

export default function MealPlanPage() {
  const [weekStartISO, setWeekStartISO] = useState(getWeekStartMondayISO());
  const [plan, setPlan] = useState(loadMealPlanForWeek(weekStartISO));
  const [query, setQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState('mon');

  // load when weekStart changes
  useEffect(() => {
    setPlan(loadMealPlanForWeek(weekStartISO));
  }, [weekStartISO]);

  const approvedRecipes = useMemo(() => {
    // Pull recipes from localStorage merged set produced by the main app pipeline.
    // Fall back to empty array if unavailable.
    try {
      const raw = window.localStorage.getItem('app_recipes:v1');
      const arr = raw ? JSON.parse(raw) : [];
      return (arr || []).filter((r) => (r?.status || 'approved') === 'approved');
    } catch {
      return [];
    }
  }, []);

  const filteredRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return approvedRecipes;
    return approvedRecipes.filter((r) => (r.title || '').toLowerCase().includes(q));
  }, [approvedRecipes, query]);

  const onPrevWeek = () => {
    const d = new Date(weekStartISO);
    d.setDate(d.getDate() - 7);
    setWeekStartISO(getWeekStartMondayISO(d));
  };

  const onNextWeek = () => {
    const d = new Date(weekStartISO);
    d.setDate(d.getDate() + 7);
    setWeekStartISO(getWeekStartMondayISO(d));
  };

  const addToDay = (dayKey, recipe) => {
    addRecipeToDay(weekStartISO, dayKey, recipe);
    setPlan(loadMealPlanForWeek(weekStartISO));
  };

  const removeFromDay = (dayKey, entryId) => {
    removeRecipeFromDay(weekStartISO, dayKey, entryId);
    setPlan(loadMealPlanForWeek(weekStartISO));
  };

  const clearDayEntries = (dayKey) => {
    clearDay(weekStartISO, dayKey);
    setPlan(loadMealPlanForWeek(weekStartISO));
  };

  const getRecipeById = (id) => approvedRecipes.find((r) => r.id === id);

  const addDayIngredientsToShopping = (dayKey) => {
    const entries = plan.days[dayKey] || [];
    const rList = entries.map((e) => getRecipeById(e.recipeId)).filter(Boolean);
    const merged = aggregateIngredientsFromRecipes(rList);
    for (const it of merged) {
      addShoppingItem({ name: it.display, quantity: it.quantity || '', unit: it.unit || '' });
    }
    alert('Ingredients added to shopping list.');
  };

  const addWeekIngredientsToShopping = () => {
    const allEntries = DAYS.flatMap((d) => plan.days[d] || []);
    const rList = allEntries.map((e) => getRecipeById(e.recipeId)).filter(Boolean);
    const merged = aggregateIngredientsFromRecipes(rList);
    for (const it of merged) {
      addShoppingItem({ name: it.display, quantity: it.quantity || '', unit: it.unit || '' });
    }
    alert('Week ingredients added to shopping list.');
  };

  useEffect(() => {
    saveMealPlanForWeek(plan);
  }, [plan]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">Weekly Meal Plan</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onPrevWeek} aria-label="Previous week">
            ← Previous
          </button>
          <div className="week-label">
            Week of <strong>{weekStartISO}</strong>
          </div>
          <button className="btn-secondary" onClick={onNextWeek} aria-label="Next week">
            Next →
          </button>
          <button className="btn-primary" onClick={addWeekIngredientsToShopping}>
            Add week’s ingredients to shopping list
          </button>
        </div>
      </header>

      <section className="card">
        <div className="plan-toolbar">
          <label className="sr-only" htmlFor="day-select">
            Day select
          </label>
          <select
            id="day-select"
            className="input"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {dayLabels[d]}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Search recipes to add..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search recipes"
          />
        </div>
        <div className="recipe-picker">
          <div className="picker-list">
            {(filteredRecipes || []).slice(0, 50).map((r) => (
              <button
                key={r.id}
                className="picker-item"
                onClick={() => addToDay(selectedDay, r)}
                title={`Add ${r.title} to ${dayLabels[selectedDay]}`}
              >
                <div className="title">{r.title}</div>
                <div className="meta">
                  {r.category && <span className="chip">{r.category}</span>}
                  {r.cookingTime && <span className="chip">{r.cookingTime}</span>}
                </div>
              </button>
            ))}
            {filteredRecipes.length === 0 && <div className="empty">No recipes match.</div>}
          </div>
        </div>
      </section>

      <div className="week-grid">
        {DAYS.map((d) => (
          <section className="card day" key={d}>
            <div className="group-header">
              <h2>{dayLabels[d]}</h2>
              <div className="header-actions">
                <button className="btn-secondary" onClick={() => addDayIngredientsToShopping(d)}>
                  Add day’s ingredients
                </button>
                <button className="btn-link danger" onClick={() => clearDayEntries(d)}>
                  Clear day
                </button>
              </div>
            </div>
            <div className="day-list">
              {(plan.days[d] || []).map((entry) => (
                <SmallRecipeRow
                  key={entry.id}
                  entry={entry}
                  onRemove={() => removeFromDay(d, entry.id)}
                />
              ))}
              {(plan.days[d] || []).length === 0 && <div className="empty">No recipes</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
