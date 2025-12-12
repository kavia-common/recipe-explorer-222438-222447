import React, { useEffect, useMemo, useRef, useState } from 'react';
import { navigateTo } from '../data/admin';
import NotificationSettings from './NotificationSettings';
import { SUPPORTED_LANGUAGES, getSelectedLanguage, setSelectedLanguage, tUI } from '../data/i18n';

/**
 * Header with brand, search input, category filter, favorites filter, theme toggle, nav, and language selector.
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: function to toggle theme
 * - query: string value
 * - onQueryChange: setter for query
 * - showOnlyFavorites: boolean
 * - onToggleFavoritesFilter: function
 * - favoritesCount: number
 * - category: string
 * - onCategoryChange: (cat: string) => void
 * - categoryOptions: string[]
 * - difficulty: string
 * - onDifficultyChange: (d: string) => void
 * - difficultyOptions: string[]
 * - onAddRecipe?: () => void
 * - cookTime: string ('All' | '<10' | '<30' | '>=60')
 * - onCookTimeChange: (v: string) => void
 * - quickSnacksOnly: boolean
 * - onToggleQuickSnacks: () => void
 */
const Header = ({
  theme,
  onToggleTheme,
  query,
  onQueryChange,
  showOnlyFavorites = false,
  onToggleFavoritesFilter = () => {},
  favoritesCount = 0,
  category = 'All',
  onCategoryChange = () => {},
  categoryOptions = ['All', 'Veg', 'Non-Veg', 'Desserts', 'Drinks'],
  difficulty = 'All',
  onDifficultyChange = () => {},
  difficultyOptions = ['All', 'Easy', 'Medium', 'Hard'],
  onAddRecipe = () => {},
  cookTime = 'All',
  onCookTimeChange = () => {},
  quickSnacksOnly = false,
  onToggleQuickSnacks = () => {},
  // New nutrition filters
  caloriesBucket = 'All',
  onCaloriesBucketChange = () => {},
  highProtein = false,
  onToggleHighProtein = () => {},
  dietTypes = [],
  onDietTypesChange = () => {},
  // Seasonal filter
  seasonal = 'All',
  onSeasonalChange = () => {},
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [lang, setLang] = useState(getSelectedLanguage());

  useEffect(() => {
    setLang(getSelectedLanguage());
  }, []);

  const Pill = ({ label, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="theme-toggle"
      aria-pressed={active}
      style={{
        padding: '6px 10px',
        background: active ? 'rgba(37,99,235,0.08)' : 'var(--ocean-surface)',
        borderColor: active ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : 'var(--ocean-border)',
      }}
    >
      {label}
    </button>
  );

  const go = (path) => navigateTo(path);

  const onLangChange = (e) => {
    const value = e.target.value;
    setLang(value);
    setSelectedLanguage(value);
  };

  // VoiceSearchButton encapsulates SpeechRecognition wiring and UI
  const VoiceSearchButton = ({ lang, onTranscript }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);
    const dotRef = useRef(null);

    // Map app language to SpeechRecognition language codes
    const recogLang = useMemo(() => {
      const map = { en: 'en-US', hi: 'hi-IN', te: 'te-IN' };
      return map[lang] || 'en-US';
    }, [lang]);

    const SpeechRecognition = useMemo(() => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      return SR;
    }, []);

    useEffect(() => {
      if (!SpeechRecognition) {
        setSupported(false);
      }
    }, [SpeechRecognition]);

    // Teeny pulse animation via inline style if needed
    const pulseStyle = isRecording
      ? {
          boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
          animation: 'ocean-pulse 1.5s infinite',
        }
      : {};

    // start recognition flow
    const start = () => {
      if (!SpeechRecognition) {
        setSupported(false);
        // Friendly toast fallback
        try {
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: 'Voice search not available',
              body: 'Try using Chrome/Edge or enable microphone permissions.',
            }
          }));
        } catch {}
        return;
      }
      try {
        const recog = new SpeechRecognition();
        recognitionRef.current = recog;
        recog.lang = recogLang;
        recog.interimResults = false;
        recog.maxAlternatives = 1;
        setIsRecording(true);

        recog.onresult = (event) => {
          try {
            const transcript = event.results?.[0]?.[0]?.transcript || '';
            if (transcript) {
              onTranscript(transcript);
            }
          } catch {}
        };
        recog.onend = () => {
          setIsRecording(false);
        };
        recog.onerror = (e) => {
          setIsRecording(false);
          const err = (e && e.error) || 'error';
          // Graceful, non-blocking toast
          let msg = 'Voice input error.';
          if (err === 'no-speech') msg = 'No speech detected. Please try again.';
          else if (err === 'aborted' || err === 'audio-capture') msg = 'Voice input canceled or microphone unavailable.';
          else if (err === 'not-allowed' || err === 'service-not-allowed') msg = 'Microphone permission denied.';
          else if (err === 'network') msg = 'Network error during speech recognition.';
          try {
            window.dispatchEvent(new CustomEvent('app:toast', {
              detail: {
                title: 'Voice search',
                body: msg,
              }
            }));
          } catch {}
        };
        recog.start();
      } catch (e) {
        setIsRecording(false);
        try {
          window.dispatchEvent(new CustomEvent('app:toast', {
            detail: {
              title: 'Voice search',
              body: 'Could not start microphone. Please check permissions.',
            }
          }));
        } catch {}
      }
    };

    const stop = () => {
      try {
        const r = recognitionRef.current;
        if (r) {
          r.onresult = null;
          r.onerror = null;
          r.onend = null;
          try { r.stop(); } catch {}
          recognitionRef.current = null;
        }
      } catch {}
      setIsRecording(false);
    };

    const toggle = () => {
      if (isRecording) stop(); else start();
    };

    const label = isRecording ? 'Stop voice search' : 'Start voice search';
    const title = isRecording ? 'Stop voice search' : 'Start voice search';
    const tooltip = isRecording ? 'Listening… click to stop' : 'Search by voice';

    // Hide button if unsupported but we still want a hint toast on click attempt
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
        <button
          type="button"
          className="theme-toggle"
          aria-label={label}
          title={tooltip}
          onClick={toggle}
          onKeyDown={handleKey}
          disabled={!supported}
          style={{
            padding: '6px 10px',
            position: 'relative',
            borderColor: isRecording ? 'color-mix(in oklab, var(--ocean-error), var(--ocean-border))' : undefined,
            background: isRecording ? 'rgba(239,68,68,0.10)' : 'var(--ocean-surface)',
            ...pulseStyle,
          }}
        >
          <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {isRecording ? '🎙️' : '🎤'} <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>{isRecording ? 'Listening' : 'Voice'}</span>
          </span>
          {isRecording && (
            <span
              ref={dotRef}
              aria-hidden
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 999,
                background: 'var(--ocean-error)',
                marginLeft: 8,
                boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.6)',
              }}
              title="Recording"
            />
          )}
        </button>
        {!supported && (
          <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }} title="Browser does not support voice search">
            ⓘ
          </span>
        )}
        <style>
          {`
          @keyframes ocean-pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          `}
        </style>
      </div>
    );
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div
          className="brand"
          aria-label="Recipe Explorer"
          role="link"
          tabIndex={0}
          onClick={() => go('/')}
          onKeyDown={(e) => e.key === 'Enter' && go('/')}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo" aria-hidden>Rx</div>
          <div>
            <div className="title">Recipe Explorer</div>
            <div className="subtitle">Discover, search, and cook</div>
          </div>
        </div>

        <label className="search-wrap" aria-label={tUI('Search', lang)} style={{ minWidth: 0, position: 'relative' }}>
          <span className="search-icon" aria-hidden>🔎</span>
          <input
            placeholder="Search by name or ingredients"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            aria-label="Search input"
          />
          {/** Voice search mic button */}
          <VoiceSearchButton lang={lang} onTranscript={(text) => onQueryChange(text)} />
        </label>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* Primary navigation */}
          <nav aria-label="Primary" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="theme-toggle" onClick={() => go('/')} title="Home">Home</button>
            <button className="theme-toggle" onClick={() => go('/shopping')} title="Shopping">Shopping</button>
            <button className="theme-toggle" onClick={() => go('/plan')} title="Planning">Planning</button>
            <button className="theme-toggle" onClick={() => go('/collections')} title="Collections">Collections</button>
            <button className="theme-toggle" onClick={() => go('/chefs')} title="Chefs">Chefs</button>
            <button className="theme-toggle" onClick={() => go('/settings')} title="Settings">Settings</button>
            <button
              className="theme-toggle"
              onClick={onAddRecipe}
              aria-label="Add Recipe"
              title="Add Recipe"
              style={{ background: 'rgba(37,99,235,0.10)' }}
            >
              ➕ {tUI('Recipes', lang)}
            </button>
          </nav>

          {/* Category selector - pills on wide screens */}
          <div aria-label="Category filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categoryOptions.map((opt) => (
              <Pill
                key={opt}
                label={opt}
                active={category === opt}
                onClick={() => onCategoryChange(opt)}
              />
            ))}
          </div>

          {/* Seasonal selector */}
          <div aria-label="Seasonal filter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>Season</span>
            <select
              aria-label="Seasonal select"
              value={typeof seasonal !== 'undefined' ? seasonal : 'All'}
              onChange={(e) => { if (typeof onSeasonalChange === 'function') onSeasonalChange(e.target.value); }}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)'
              }}
            >
              {['All', 'Summer', 'Winter', 'Festival'].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Difficulty selector - compact */}
          <div aria-label="Difficulty filter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>{tUI('Difficulty', lang)}</span>
            <select
              aria-label="Difficulty select"
              value={difficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)'
              }}
            >
              {difficultyOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Cook Time selector */}
          <div aria-label="Cook Time filter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>Cook Time</span>
            <select
              aria-label="Cook Time select"
              value={cookTime}
              onChange={(e) => onCookTimeChange(e.target.value)}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)'
              }}
            >
              {['All', '<10', '<30', '>=60'].map((opt) => <option key={opt} value={opt}>{opt === '<10' ? 'Under 10 minutes' : opt === '<30' ? 'Under 30 minutes' : opt === '>=60' ? 'Long recipes (>=60)' : 'All'}</option>)}
            </select>
          </div>

          {/* Calories bucket */}
          <div aria-label="Calories filter" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--ocean-muted)' }}>Calories</span>
            <select
              aria-label="Calories select"
              value={caloriesBucket}
              onChange={(e) => onCaloriesBucketChange(e.target.value)}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)'
              }}
            >
              {['All', 'Low (<300)', 'Moderate (300–600)', 'High (>600)'].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* High protein toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleHighProtein}
            aria-pressed={highProtein}
            aria-label="High protein"
            title="High protein (≥20g)"
            style={{
              borderColor: highProtein ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : undefined,
              background: highProtein ? 'rgba(37,99,235,0.08)' : undefined
            }}
          >
            💪 High protein
          </button>

          {/* Diet types multi-select as pills */}
          <div aria-label="Diet types filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['keto', 'vegan', 'gluten-free', 'sugar-free'].map((d) => {
              const active = (dietTypes || []).map(String).map(s => s.toLowerCase()).includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  className="theme-toggle"
                  aria-pressed={active}
                  onClick={() => {
                    const set = new Set((dietTypes || []).map(x => String(x).toLowerCase()));
                    if (set.has(d)) set.delete(d); else set.add(d);
                    onDietTypesChange(Array.from(set));
                  }}
                  style={{
                    padding: '6px 10px',
                    background: active ? 'rgba(37,99,235,0.08)' : 'var(--ocean-surface)',
                    borderColor: active ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : 'var(--ocean-border)',
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* Quick Snacks toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleQuickSnacks}
            aria-pressed={quickSnacksOnly}
            aria-label="Quick Snacks only"
            title="Quick Snacks"
            style={{
              borderColor: quickSnacksOnly ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : undefined,
              background: quickSnacksOnly ? 'rgba(37,99,235,0.08)' : undefined
            }}
          >
            🍪 Quick Snacks
          </button>

          {/* Favorites */}
          <button
            className="theme-toggle"
            onClick={onToggleFavoritesFilter}
            aria-pressed={showOnlyFavorites}
            aria-label="Toggle favorites filter"
            title="Show only favorites"
            style={{
              borderColor: showOnlyFavorites ? 'color-mix(in oklab, var(--ocean-primary), var(--ocean-border))' : undefined,
              background: showOnlyFavorites ? 'rgba(37,99,235,0.08)' : undefined
            }}
          >
            <span aria-hidden>❤️</span> Favorites{favoritesCount ? ` (${favoritesCount})` : ''}
          </button>

          {/* Admin */}
          <button
            className="theme-toggle"
            onClick={() => navigateTo('/admin/dashboard')}
            aria-label="Admin"
            title="Admin"
            style={{ borderColor: 'var(--ocean-border)' }}
          >
            🛠️ {tUI('Admin', lang)}
          </button>

          {/* Notifications bell */}
          <button
            className="theme-toggle"
            onClick={() => setShowNotif(true)}
            aria-label="Notifications"
            title="Notifications"
            style={{ borderColor: 'var(--ocean-border)' }}
          >
            🔔
          </button>

          {/* Language selector */}
          <div aria-label={tUI('Language', lang)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span aria-hidden title={tUI('Language', lang)}>🌐</span>
            <label htmlFor="language-select" className="sr-only">{tUI('Language', lang)}</label>
            <select
              id="language-select"
              aria-label={tUI('Language', lang)}
              value={lang}
              onChange={onLangChange}
              style={{
                border: '1px solid var(--ocean-border)',
                background: 'var(--ocean-surface)',
                color: 'var(--ocean-text)',
                padding: '8px 12px',
                borderRadius: 999,
                boxShadow: 'var(--ocean-shadow)',
                cursor: 'pointer',
              }}
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </div>
      {showNotif && <NotificationSettings onClose={() => setShowNotif(false)} />}
    </header>
  );
};

export default Header;
