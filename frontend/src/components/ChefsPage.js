import React, { useMemo, useState } from 'react';
import { discoverChefsFromRecipes, getFollowerCount, isFollowing, toggleFollow } from '../data/community';

// PUBLIC_INTERFACE
export default function ChefsPage({ recipes = [] }) {
  /** Lists known chefs derived from recipes with follower counts and follow buttons. */
  const chefs = useMemo(() => discoverChefsFromRecipes(recipes), [recipes]);
  const [stateBump, setStateBump] = useState(0);

  const sorted = useMemo(() => {
    return [...chefs]
      .map(c => ({ ...c, followerCount: getFollowerCount(c.id) }))
      .sort((a, b) => b.followerCount - a.followerCount);
  }, [chefs, stateBump]);

  const followClick = (id) => {
    toggleFollow(id);
    setStateBump(x => x + 1);
  };

  return (
    <main className="container">
      <div className="section-title">Chefs</div>
      <div className="grid" role="list">
        {sorted.map(c => {
          const following = isFollowing(c.id);
          const topRecipes = (c.recipeIds || []).slice(0, 3);
          return (
            <article key={c.id} className="card" role="listitem" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="tag" aria-label={`Chef ${c.name}`} style={{ background: 'rgba(37,99,235,0.06)', borderColor: 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' }}>
                    👨‍🍳 {c.name}
                  </span>
                  <span style={{ color: 'var(--ocean-muted)', fontSize: 12 }}>{getFollowerCount(c.id)} followers</span>
                </div>
                <button
                  className="theme-toggle"
                  aria-pressed={following}
                  aria-label={following ? 'Unfollow chef' : 'Follow chef'}
                  onClick={() => followClick(c.id)}
                  style={{ background: following ? 'rgba(37,99,235,0.10)' : undefined }}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Top recipes</div>
                <ul className="list">
                  {topRecipes.length === 0 && <li style={{ color: 'var(--ocean-muted)' }}>No recipes yet</li>}
                  {topRecipes.map(rid => {
                    const rec = recipes.find(r => String(r.id) === String(rid));
                    return <li key={rid}>{rec?.title || rid}</li>;
                  })}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
