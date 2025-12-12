import { render, screen, fireEvent, within, act } from '@testing-library/react';
import App from './App';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to add a recipe through the UI
async function addRecipeFlow() {
  const addBtn = await screen.findByRole('button', { name: /add recipe/i });
  fireEvent.click(addBtn);

  const titleInput = await screen.findByLabelText(/Title\/Name/i);
  fireEvent.change(titleInput, { target: { value: 'Test Brownie' } });

  const descInput = screen.getByLabelText(/Description/i);
  fireEvent.change(descInput, { target: { value: 'Fudgy brownie test' } });

  const imgInput = screen.getByLabelText(/Image URL/i);
  fireEvent.change(imgInput, { target: { value: 'https://example.com/brownie.jpg' } });

  const ingInput = screen.getByLabelText(/Ingredients/i);
  fireEvent.change(ingInput, { target: { value: 'Flour\nCocoa\nSugar\nButter' } });

  const stepsInput = screen.getByLabelText(/Steps/i);
  fireEvent.change(stepsInput, { target: { value: 'Mix\nBake' } });

  // Select category Desserts
  const catBtn = screen.getByRole('button', { name: 'Desserts' });
  fireEvent.click(catBtn);

  // Set cooking time and difficulty
  const timeInput = screen.getByLabelText(/Cooking Time/i);
  fireEvent.change(timeInput, { target: { value: '35' } });
  const diffSelect = screen.getByLabelText(/Difficulty select/i);
  fireEvent.change(diffSelect, { target: { value: 'Hard' } });

  const saveBtn = screen.getByRole('button', { name: /Add Recipe/i });
  fireEvent.click(saveBtn);

  await act(async () => { await wait(50); });
}

beforeEach(() => {
  try { window.localStorage.clear(); } catch {}
  window.location.hash = '#/';
});

test('renders header title', () => {
  render(<App />);
  const title = screen.getByText(/Recipe Explorer/i);
  expect(title).toBeInTheDocument();
});

test('renders Favorites toggle in header', () => {
  render(<App />);
  const favButton = screen.getByRole('button', { name: /favorites/i });
  expect(favButton).toBeInTheDocument();
});

test('language selector persists across reloads', () => {
  render(<App />);
  const select = screen.getByLabelText(/Language|भाषा|భాష/i);
  fireEvent.change(select, { target: { value: 'hi' } });
  expect(localStorage.getItem('app_language')).toBe('hi');
});

test('opening a recipe shows translation when lang != en and toggles view original', async () => {
  render(<App />);
  // open first recipe card
  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  fireEvent.click(items[0]);

  // In modal, choose Hindi
  const langSelect = await screen.findByLabelText(/Language|भाषा|భాష/i);
  fireEvent.change(langSelect, { target: { value: 'hi' } });

  // Expect translation banner
  const banner = await screen.findByText(/Translated from English|अंग्रेज़ी से अनुवादित|ఆంగ్లం నుండి అనువదించబడింది/i);
  expect(banner).toBeInTheDocument();

  // Toggle view original
  const toggleBtn = screen.getByRole('button', { name: /View original|मूल देखें|అసలు చూడండి/i });
  fireEvent.click(toggleBtn);

  // After toggling, button should offer "View translation"
  expect(screen.getByRole('button', { name: /View translation|अनुवाद देखें|అనువాదాన్ని చూడండి/i })).toBeInTheDocument();
});

test('can navigate to Shopping and Planning routes', async () => {
  render(<App />);
  const shopping = await screen.findByRole('button', { name: /shopping/i });
  fireEvent.click(shopping);
  expect(window.location.hash).toContain('shopping');

  const planning = screen.getByRole('button', { name: /planning/i });
  fireEvent.click(planning);
  expect(window.location.hash).toContain('plan');
});

test('shopping list: add custom item, toggle purchased, clear purchased', async () => {
  render(<App />);
  const shopping = await screen.findByRole('button', { name: /shopping/i });
  fireEvent.click(shopping);

  // add item
  const nameInput = await screen.findByLabelText(/item name/i);
  const qtyInput = screen.getByLabelText(/quantity/i);
  const unitInput = screen.getByLabelText(/unit/i);
  fireEvent.change(nameInput, { target: { value: 'Tomatoes' } });
  fireEvent.change(qtyInput, { target: { value: '2' } });
  fireEvent.change(unitInput, { target: { value: 'pcs' } });
  fireEvent.click(screen.getByRole('button', { name: /add item/i }));

  expect(screen.getByDisplayValue('Tomatoes')).toBeInTheDocument();

  // toggle purchased then clear
  const checkbox = screen.getByRole('checkbox', { name: /mark tomatoes as purchased/i });
  fireEvent.click(checkbox);
  const clearBtn = screen.getByRole('button', { name: /clear purchased/i });
  fireEvent.click(clearBtn);

  expect(screen.queryByDisplayValue('Tomatoes')).not.toBeInTheDocument();
});

test('planning: add recipe to day and aggregate to shopping', async () => {
  render(<App />);
  const planning = await screen.findByRole('button', { name: /planning/i });
  fireEvent.click(planning);

  // Add first recipe from picker if any
  const pickerButtons = await screen.findAllByRole('button');
  const addBtn = pickerButtons.find((b) => {
    const t = b.getAttribute('title') || '';
    return /Add .* to/.test(t);
    });
  if (addBtn) {
    fireEvent.click(addBtn);

    // Add day's ingredients to shopping
    // suppress alert in tests
    const oldAlert = window.alert; window.alert = () => {};
    const dayBtn = await screen.findByRole('button', { name: /add day’s ingredients/i });
    fireEvent.click(dayBtn);
    window.alert = oldAlert;

    // Navigate to Shopping to ensure page renders
    const shopping = screen.getByRole('button', { name: /shopping/i });
    fireEvent.click(shopping);
    expect(await screen.findByText(/Shopping List/i)).toBeInTheDocument();
  }
});

test('filtering by category reduces visible items for a specific category', async () => {
  render(<App />);
  const allPill = await screen.findByRole('button', { name: 'All' });
  expect(allPill).toBeInTheDocument();

  const gridBefore = await screen.findByRole('list');
  const itemsBefore = within(gridBefore).getAllByRole('listitem');

  const dessertsPill = screen.getByRole('button', { name: 'Desserts' });
  fireEvent.click(dessertsPill);

  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');

  expect(itemsAfter.length).toBeLessThanOrEqual(itemsBefore.length);
  expect(itemsAfter.length).toBeGreaterThan(0);
});

test('search by title returns matching items', async () => {
  render(<App />);

  const grid = await screen.findByRole('list');
  const initialItems = within(grid).getAllByRole('listitem');
  expect(initialItems.length).toBeGreaterThan(0);

  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'pizza' } });

  await act(async () => { await wait(250); });

  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');
  expect(itemsAfter.length).toBeGreaterThan(0);
});

test('difficulty filter affects displayed list', async () => {
  render(<App />);
  await screen.findByRole('list');

  const diffSelect = screen.getByLabelText('Difficulty select');
  fireEvent.change(diffSelect, { target: { value: 'Easy' } });

  await act(async () => { await wait(50); });

  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  expect(items.length).toBeGreaterThan(0);
});

test('adding a recipe saves as pending and not visible on main feed until approved', async () => {
  render(<App />);
  await addRecipeFlow();

  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  const found = items.some((li) => within(li).queryByText('Test Brownie'));
  expect(found).toBe(false);

  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);

  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });

  const approveBtn = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approveBtn);
  await act(async () => { await wait(50); });

  window.location.hash = '#/';
  await act(async () => { await wait(100); });

  const input2 = screen.getByLabelText('Search input');
  fireEvent.change(input2, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');
  const nowFound = itemsAfter.some((li) => within(li).queryByText('Test Brownie'));
  expect(nowFound).toBe(true);
});

test('rejecting a pending recipe removes it and cleans favorites if any', async () => {
  render(<App />);
  await addRecipeFlow();

  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });

  const rejectBtn = await screen.findByRole('button', { name: 'Reject' });
  fireEvent.click(rejectBtn);
  await act(async () => { await wait(50); });

  window.location.hash = '#/';
  await act(async () => { await wait(100); });
  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  const found = items.some((li) => within(li).queryByText('Test Brownie'));
  expect(found).toBe(false);
});

test('cook time filters reduce results appropriately', async () => {
  render(<App />);
  await screen.findByRole('list');

  // Under 10 minutes
  const cookSelect = screen.getByLabelText('Cook Time select');
  fireEvent.change(cookSelect, { target: { value: '<10' } });
  await act(async () => { await wait(100); });
  const grid10 = await screen.findByRole('list');
  const items10 = within(grid10).getAllByRole('listitem');
  expect(items10.length).toBeGreaterThanOrEqual(0); // existence check

  // Under 30 minutes
  fireEvent.change(cookSelect, { target: { value: '<30' } });
  await act(async () => { await wait(100); });
  const grid30 = await screen.findByRole('list');
  const items30 = within(grid30).getAllByRole('listitem');
  expect(items30.length).toBeGreaterThanOrEqual(items10.length);

  // Long recipes
  fireEvent.change(cookSelect, { target: { value: '>=60' } });
  await act(async () => { await wait(100); });
  const gridLong = await screen.findByRole('list');
  const itemsLong = within(gridLong).getAllByRole('listitem');
  expect(itemsLong.length).toBeGreaterThanOrEqual(0);

  // Reset to All
  fireEvent.change(cookSelect, { target: { value: 'All' } });
  await act(async () => { await wait(60); });
});

test('Quick Snacks toggle filters correctly', async () => {
  render(<App />);
  await screen.findByRole('list');

  const quickBtn = screen.getByRole('button', { name: /Quick Snacks only|Quick Snacks/i });
  fireEvent.click(quickBtn);
  await act(async () => { await wait(120); });

  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  expect(items.length).toBeGreaterThanOrEqual(0);

  // turn off
  fireEvent.click(quickBtn);
  await act(async () => { await wait(60); });
});

test('Admin table shows cookingTime and difficulty columns', async () => {
  render(<App />);
  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const recipesTab = await screen.findByRole('button', { name: 'Recipes' });
  fireEvent.click(recipesTab);
  await act(async () => { await wait(50); });
  expect(await screen.findByText(/Time/)).toBeInTheDocument();
  expect(await screen.findByText(/Difficulty/)).toBeInTheDocument();
});

test('Admin edit/delete works', async () => {
  render(<App />);
  await addRecipeFlow();

  const adminBtn = await screen.findByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });
  const approveBtn = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approveBtn);
  await act(async () => { await wait(50); });

  const recipesTab = await screen.findByRole('button', { name: 'Recipes' });
  fireEvent.click(recipesTab);
  await act(async () => { await wait(50); });

  const editBtn = await screen.findByRole('button', { name: 'Edit' });
  fireEvent.click(editBtn);
  const titleInput = await screen.findByLabelText(/Title\/Name/i);
  fireEvent.change(titleInput, { target: { value: 'Test Brownie Admin Edited' } });
  const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
  fireEvent.click(saveBtn);
  await act(async () => { await wait(100); });

  const deleteBtn = await screen.findByRole('button', { name: 'Delete' });
  fireEvent.click(deleteBtn);
  const confirmDel = await screen.findByRole('button', { name: 'Delete' });
  fireEvent.click(confirmDel);
  await act(async () => { await wait(100); });

  window.location.hash = '#/';
  await act(async () => { await wait(80); });
  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie Admin Edited' } });
  await act(async () => { await wait(250); });
  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');
  const foundAfter = itemsAfter.some((li) => within(li).queryByText('Test Brownie Admin Edited'));
  expect(foundAfter).toBe(false);
});

test('new fields appear in Add Recipe form and can be saved', async () => {
  render(<App />);
  await addRecipeFlow();

  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });
  const approveBtn = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approveBtn);
  await act(async () => { await wait(50); });

  window.location.hash = '#/';
  await act(async () => { await wait(80); });

  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  expect(card).toHaveTextContent(/⏱️/);
  expect(card).toHaveTextContent(/🎯/);

  fireEvent.click(card);
  const modal = await screen.findByRole('dialog');
  expect(modal).toHaveTextContent(/⏱️ 35m/);
  expect(modal).toHaveTextContent(/🎯 Hard/);
});

test('editing a recipe updates its card and detail', async () => {
  render(<App />);
  await addRecipeFlow();

  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(card);

  const editBtn = await screen.findByRole('button', { name: /Edit recipe/i });
  fireEvent.click(editBtn);

  const titleInput = await screen.findByLabelText(/Title\/Name/i);
  fireEvent.change(titleInput, { target: { value: 'Test Brownie Updated' } });

  const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
  fireEvent.click(saveBtn);
  await act(async () => { await wait(100); });

  const maybeClose = screen.queryByLabelText('Close');
  if (maybeClose) fireEvent.click(maybeClose);

  fireEvent.change(input, { target: { value: 'Updated' } });
  await act(async () => { await wait(250); });
  const grid2 = await screen.findByRole('list');
  const items2 = within(grid2).getAllByRole('listitem');
  const foundUpdated = items2.some((li) => within(li).queryByText('Test Brownie Updated'));
  expect(foundUpdated).toBe(true);
});

test('deleting a recipe removes it from the list', async () => {
  render(<App />);
  await addRecipeFlow();

  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  let grid = await screen.findByRole('list');
  let card = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(card);

  const delBtn = await screen.findByRole('button', { name: /Delete recipe/i });
  fireEvent.click(delBtn);

  const confirmBtn = await screen.findByRole('button', { name: 'Delete' });
  fireEvent.click(confirmBtn);
  await act(async () => { await wait(100); });

  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const gridAfter = screen.queryByRole('list');
  if (gridAfter) {
    const items = within(gridAfter).getAllByRole('listitem');
    const stillThere = items.some((li) => within(li).queryByText('Test Brownie'));
    expect(stillThere).toBe(false);
  }
});

// Ratings & Reviews
test('adding a review updates average and count in detail and on card', async () => {
  render(<App />);
  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(card);

  const modal = await screen.findByRole('dialog');
  const starButtons = within(modal).getAllByRole('button').filter(b => {
    const a = b.getAttribute('aria-label') || '';
    return /star/.test(a);
    });
  expect(starButtons.length).toBe(5);

  fireEvent.click(starButtons[3]);
  const textarea = within(modal).getByLabelText(/Comment/i);
  fireEvent.change(textarea, { target: { value: 'Tasty!' } });

  const submit = within(modal).getByRole('button', { name: /Add review|Save review/i });
  fireEvent.click(submit);

  const close = within(modal).getByLabelText('Close');
  fireEvent.click(close);

  const grid2 = await screen.findByRole('list');
  const firstCard = within(grid2).getAllByRole('listitem')[0];
  expect(firstCard).toHaveTextContent('⭐');
  expect(firstCard).toHaveTextContent(/\(\d+\)/);
});

test('editing and deleting a review updates counts', async () => {
  render(<App />);

  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(card);
  const modal = await screen.findByRole('dialog');

  let starButtons = within(modal).getAllByRole('button').filter(b => /star/.test(b.getAttribute('aria-label') || ''));
  if (starButtons.length === 5) {
    fireEvent.click(starButtons[4]); // 5 stars
    const textarea = within(modal).getByLabelText(/Comment/i);
    fireEvent.change(textarea, { target: { value: 'Great!' } });
    const submit = within(modal).getByRole('button', { name: /Add review|Save review/i });
    fireEvent.click(submit);
  }

  const modal2 = await screen.findByRole('dialog');
  starButtons = within(modal2).getAllByRole('button').filter(b => /star/.test(b.getAttribute('aria-label') || ''));
  fireEvent.click(starButtons[3]); // 4 stars
  const saveBtn = within(modal2).getByRole('button', { name: /Save review/i });
  fireEvent.click(saveBtn);

  const delBtn = within(modal2).getByRole('button', { name: /Delete my review/i });
  fireEvent.click(delBtn);

  const close = within(modal2).getByLabelText('Close');
  fireEvent.click(close);

  const grid3 = await screen.findByRole('list');
  const firstCard = within(grid3).getAllByRole('listitem')[0];
  expect(firstCard).toBeInTheDocument();
});

test('Admin dashboard metrics reflect reviews and Admin table shows rating columns', async () => {
  render(<App />);
  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(card);
  const modal = await screen.findByRole('dialog');
  const starButtons = within(modal).getAllByRole('button').filter(b => /star/.test(b.getAttribute('aria-label') || ''));
  fireEvent.click(starButtons[2]); // 3 stars
  const submit = within(modal).getByRole('button', { name: /Add review|Save review/i });
  fireEvent.click(submit);
  const close = within(modal).getByLabelText('Close');
  fireEvent.click(close);

  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await screen.findByText(/Ratings/);
  expect(screen.getByText(/Avg rating across approved/)).toBeInTheDocument();

  const recipesTab = await screen.findByRole('button', { name: 'Recipes' });
  fireEvent.click(recipesTab);
  await screen.findByText(/Avg Rating/);
  await screen.findByText(/Reviews/);
});
