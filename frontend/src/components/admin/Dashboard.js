import React, { useMemo } from 'react';
import { computeAnalytics } from '../../data/adminRecipes';
import { getCommunityMetrics } from '../../data/community';
import { getTranslationStats } from '../../data/i18n';

/**
 * PUBLIC_INTERFACE
 * Admin Dashboard showing analytics and local translation stats without external libs.
 */
const Dashboard = ({ recipes }) => {
  const metrics = useMemo(() => computeAnalytics(recipes), [recipes]);

  const Bar = ({ label, value, max, color = 'var(--ocean-primary)' }) => {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
        <div style={{ height: 10, background: 'var(--ocean-bg)', border: '1px solid var(--ocean-border)', borderRadius: 999 }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: color,
              borderRadius: 999,
              transition: 'width .3s ease'
            }}
          />
        </div>
        <div style={{ marginTop: 6, color: 'var(--ocean-muted)' }}>{value}</div>
      </div>
    );
  };

  const catMax = Math.max(1, ...Object.values(metrics.categoryCounts));
  const diffMax = Math.max(1, ...Object.values(metrics.difficultyCounts || {}));
  const dist = metrics.ratingsDistribution || {1:0,2:0,3:0,4:0,5:0};
  const distMax = Math.max(1, ...Object.values(dist));
  const community = useMemo(() => getCommunityMetrics(recipes), [recipes]);

  const translationStats = getTranslationStats();
  const tsMax = Math.max(1, ...(Object.values(translationStats || {})));

  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Totals</div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="alert"><div>Total</div><div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.total}</div></div>
          <div className="alert"><div>Approved</div><div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.approved}</div></div>
          <div className="alert"><div>Pending</div><div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.pending}</div></div>
          <div className="alert"><div>Avg Time</div><div style={{ fontSize: 20, fontWeight: 800 }}>{metrics.averageCookingTime}m</div></div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Category distribution</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(metrics.categoryCounts).map(([cat, count]) => (
              <Bar key={cat} label={cat} value={count} max={catMax} />
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Difficulty distribution</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(metrics.difficultyCounts || {}).map(([d, c]) => (
              <Bar key={d} label={d} value={c} max={diffMax} />
            ))}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Ratings</div>
          <div className="alert">Avg rating across approved: <strong>{metrics.ratingsAverageAcrossApproved || 0}</strong> ⭐</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {([5,4,3,2,1]).map((k) => (
              <Bar key={k} label={`${k} ⭐`} value={dist[k] || 0} max={distMax} />
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Favorites & Top</div>
        <div className="alert">Total favorites: <strong>{metrics.favoritesTotal}</strong></div>
        <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Top favorited (up to 5)</div>
        <ul className="list">
          {metrics.topFavorited.length === 0 && <li style={{ color: 'var(--ocean-muted)' }}>No favorites yet</li>}
          {metrics.topFavorited.map((r) => (
            <li key={r.id}>{r.title}</li>
          ))}
        </ul>
        <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Top highest-rated (up to 5)</div>
        <ul className="list">
          {(metrics.topHighestRated || []).length === 0 && <li style={{ color: 'var(--ocean-muted)' }}>No reviews yet</li>}
          {(metrics.topHighestRated || []).map((r) => (
            <li key={r.id}>
              <span style={{ fontWeight: 600 }}>{r.title}</span>
              <span style={{ color: 'var(--ocean-muted)' }}> — {r.averageRating} ⭐ ({r.reviewCount})</span>
            </li>
          ))}
        </ul>
        <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Recently added</div>
        <ul className="list">
          {metrics.recentlyAdded.map((r) => (
            <li key={r.id}>
              <span style={{ fontWeight: 600 }}>{r.title}</span>
              <span style={{ color: 'var(--ocean-muted)' }}> — {new Date(r.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Community</div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="alert"><div>Total Comments</div><div style={{ fontSize: 20, fontWeight: 800 }}>{community.totalComments}</div></div>
          <div className="alert"><div>Total Likes</div><div style={{ fontSize: 20, fontWeight: 800 }}>{community.totalLikes}</div></div>
          <div className="alert"><div>Top Most-liked Count</div><div style={{ fontSize: 20, fontWeight: 800 }}>{community.topMostLiked[0]?.count || 0}</div></div>
        </div>

        <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Top 5 most liked recipes</div>
        <ul className="list">
          {community.topMostLiked.length === 0 && <li style={{ color: 'var(--ocean-muted)' }}>No likes yet</li>}
          {community.topMostLiked.map(x => (
            <li key={x.id}>
              <span style={{ fontWeight: 600 }}>{x.title}</span>
              <span style={{ color: 'var(--ocean-muted)' }}> — {x.count} likes</span>
            </li>
          ))}
        </ul>

        <div style={{ fontWeight: 700, marginTop: 8, marginBottom: 6 }}>Most followed chefs</div>
        <ul className="list">
          {community.mostFollowedChefs.length === 0 && <li style={{ color: 'var(--ocean-muted)' }}>No follows yet</li>}
          {community.mostFollowedChefs.map(c => (
            <li key={c.id}>
              <span style={{ fontWeight: 600 }}>{c.name}</span>
              <span style={{ color: 'var(--ocean-muted)' }}> — {c.count} followers</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Translation Views (Local)</div>
        {(!translationStats || Object.keys(translationStats).length === 0) && <div className="alert">No translated views yet.</div>}
        <div role="img" aria-label="Translation language views bar chart" style={{ display: 'grid', gap: 8 }}>
          {Object.entries(translationStats).map(([lng, count]) => (
            <div key={lng} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, textAlign: 'right' }}>{lng.toUpperCase()}</div>
              <div style={{ height: 12, width: `${Math.max(8, Math.round((count / tsMax) * 320))}px`, background: 'var(--ocean-secondary)', borderRadius: 6 }} title={`${lng}: ${count}`} />
              <div>{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
