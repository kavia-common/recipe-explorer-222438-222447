import { getSelectedLanguage, setSelectedLanguage, translateRecipe } from './data/i18n';

describe('i18n language persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to en', () => {
    expect(getSelectedLanguage()).toBe('en');
  });

  it('persists selected language', () => {
    setSelectedLanguage('hi');
    expect(getSelectedLanguage()).toBe('hi');
  });
});

describe('translateRecipe caching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const recipe = {
    id: 'r1',
    title: 'Pasta',
    description: 'Mix and serve',
    ingredients: ['water', 'salt'],
    instructions: ['boil water', 'add salt', 'mix pasta', 'serve'],
  };

  it('returns original for en', () => {
    const out = translateRecipe(recipe, 'en');
    expect(out).toEqual(recipe);
  });

  it('caches translations per id and lang', () => {
    const first = translateRecipe(recipe, 'hi');
    const again = translateRecipe(recipe, 'hi');
    expect(again).toEqual(first); // deep equals should hold due to cache reuse
  });
});
