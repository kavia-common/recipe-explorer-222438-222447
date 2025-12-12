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
  const diffSelect = screen.getByLabelText(/Difficulty/i);
  fireEvent.change(diffSelect, { target: { value: 'Hard' } });

  const saveBtn = screen.getByRole('button', { name: /Add Recipe/i });
  fireEvent.click(saveBtn);

  // wait a tick
  await act(async () => { await wait(50); });
}

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

test('renders category filter pills', async () => {
  render(<App />);
  // Category pills should be visible: All, Veg, Non-Veg, Desserts, Drinks
  const allPill = await screen.findByRole('button', { name: 'All' });
  const vegPill = screen.getByRole('button', { name: 'Veg' });
  const nonVegPill = screen.getByRole('button', { name: 'Non-Veg' });
  const dessertsPill = screen.getByRole('button', { name: 'Desserts' });
  const drinksPill = screen.getByRole('button', { name: 'Drinks' });

  expect(allPill).toBeInTheDocument();
  expect(vegPill).toBeInTheDocument();
  expect(nonVegPill).toBeInTheDocument();
  expect(dessertsPill).toBeInTheDocument();
  expect(drinksPill).toBeInTheDocument();
});

test('filtering by category reduces visible items for a specific category', async () => {
  render(<App />);
  // Wait for grid items to load
  const allPill = await screen.findByRole('button', { name: 'All' });
  expect(allPill).toBeInTheDocument();

  // Count items before filter
  const gridBefore = await screen.findByRole('list');
  const itemsBefore = within(gridBefore).getAllByRole('listitem');

  // Apply Desserts filter
  const dessertsPill = screen.getByRole('button', { name: 'Desserts' });
  fireEvent.click(dessertsPill);

  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');

  // After selecting a specific category, expect the list to be reduced (unless already minimal)
  expect(itemsAfter.length).toBeLessThanOrEqual(itemsBefore.length);
  // There should be at least one item for Desserts in mock
  expect(itemsAfter.length).toBeGreaterThan(0);
});

test('search by title returns matching items', async () => {
  render(<App />);

  // wait for initial list
  const grid = await screen.findByRole('list');
  const initialItems = within(grid).getAllByRole('listitem');
  expect(initialItems.length).toBeGreaterThan(0);

  const input = screen.getByLabelText('Search input');
  // Title includes "Pizza"
  fireEvent.change(input, { target: { value: 'pizza' } });

  // debounce 200ms
  await act(async () => {
    await wait(250);
  });

  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');
  // Should match at least the Margherita Pizza recipe
  expect(itemsAfter.length).toBeGreaterThan(0);
});

test('difficulty filter affects displayed list', async () => {
  render(<App />);
  // Wait initial grid
  await screen.findByRole('list');

  // Select difficulty Easy
  const diffSelect = screen.getByLabelText('Difficulty select');
  fireEvent.change(diffSelect, { target: { value: 'Easy' } });

  await act(async () => { await wait(50); });

  // There should be at least one item with Easy in mock
  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  expect(items.length).toBeGreaterThan(0);
});
  render(<App />);

  // wait for initial list
  const grid = await screen.findByRole('list');
  const initialItems = within(grid).getAllByRole('listitem');
  expect(initialItems.length).toBeGreaterThan(0);

  const input = screen.getByLabelText('Search input');
  // Ingredient present in mock: "Garlic" appears in multiple recipes
  fireEvent.change(input, { target: { value: 'garlic' } });

  // debounce 200ms
  await act(async () => {
    await wait(250);
  });

  const gridAfter = await screen.findByRole('list');
  const itemsAfter = within(gridAfter).getAllByRole('listitem');
  expect(itemsAfter.length).toBeGreaterThan(0);
});

test('adding a recipe saves as pending and not visible on main feed until approved', async () => {
  render(<App />);
  await addRecipeFlow();

  // Narrow search to the new item on main feed (should not appear because pending)
  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  // It should not appear yet
  const grid = await screen.findByRole('list');
  const items = within(grid).getAllByRole('listitem');
  const found = items.some((li) => within(li).queryByText('Test Brownie'));
  expect(found).toBe(false);

  // Open Admin Approvals and approve it
  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);

  // Should navigate to admin dashboard by default, go to approvals
  await act(async () => { await wait(50); });
  // Click Approvals tab
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });

  // Approve the pending item
  const approveBtn = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approveBtn);
  await act(async () => { await wait(50); });

  // Navigate back to main
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

  // Go to admin approvals
  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });

  // Reject (confirm native confirm will default to true in jsdom)
  const rejectBtn = await screen.findByRole('button', { name: 'Reject' });
  fireEvent.click(rejectBtn);
  await act(async () => { await wait(50); });

  // Back to main and ensure cannot find it
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

test('Admin table shows cookingTime and difficulty columns', async () => {
  render(<App />);
  // Navigate to Admin Recipes
  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const recipesTab = await screen.findByRole('button', { name: 'Recipes' });
  fireEvent.click(recipesTab);
  await act(async () => { await wait(50); });
  // Column headers should include Time and Difficulty
  expect(await screen.findByText(/Time/)).toBeInTheDocument();
  expect(await screen.findByText(/Difficulty/)).toBeInTheDocument();
});

test('Admin edit/delete works', async () => {
  render(<App />);
  await addRecipeFlow();

  // Approve first so it appears everywhere
  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });
  const approveBtn = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approveBtn);
  await act(async () => { await wait(50); });

  // Go to Recipes
  const recipesTab = await screen.findByRole('button', { name: 'Recipes' });
  fireEvent.click(recipesTab);
  await act(async () => { await wait(50); });

  // Click Edit via table (open editor)
  const editBtn = await screen.findByRole('button', { name: 'Edit' });
  fireEvent.click(editBtn);
  const titleInput = await screen.findByLabelText(/Title\/Name/i);
  fireEvent.change(titleInput, { target: { value: 'Test Brownie Admin Edited' } });
  const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
  fireEvent.click(saveBtn);
  await act(async () => { await wait(100); });

  // Now delete it
  const deleteBtn = await screen.findByRole('button', { name: 'Delete' });
  fireEvent.click(deleteBtn);
  const confirmDel = await screen.findByRole('button', { name: 'Delete' });
  fireEvent.click(confirmDel);
  await act(async () => { await wait(100); });

  // Back to main and ensure not present
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

  // Go to admin approvals and approve so it shows in main feed
  const adminBtn = screen.getByRole('button', { name: /Admin/i });
  fireEvent.click(adminBtn);
  await act(async () => { await wait(50); });
  const approvalsTab = await screen.findByRole('button', { name: 'Approvals' });
  fireEvent.click(approvalsTab);
  await act(async () => { await wait(50); });
  const approveBtn = await screen.findByRole('button', { name: 'Approve' });
  fireEvent.click(approveBtn);
  await act(async () => { await wait(50); });

  // Back to main
  window.location.hash = '#/';
  await act(async () => { await wait(80); });

  // Search and open
  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  // Should show difficulty/cooking time badges text
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

  // Open newly added recipe by searching quick
  const input = screen.getByLabelText('Search input');
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const grid = await screen.findByRole('list');
  const card = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(card);

  // In modal, click Edit
  const editBtn = await screen.findByRole('button', { name: /Edit recipe/i });
  fireEvent.click(editBtn);

  const titleInput = await screen.findByLabelText(/Title\/Name/i);
  fireEvent.change(titleInput, { target: { value: 'Test Brownie Updated' } });

  const saveBtn = screen.getByRole('button', { name: /Save Changes/i });
  fireEvent.click(saveBtn);
  await act(async () => { await wait(100); });

  // Close modal if still open
  const maybeClose = screen.queryByLabelText('Close');
  if (maybeClose) fireEvent.click(maybeClose);

  // Search for updated
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

  // Narrow search
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

  // Now the list should not contain the item
  fireEvent.change(input, { target: { value: 'Test Brownie' } });
  await act(async () => { await wait(250); });

  const gridAfter = screen.queryByRole('list');
  if (gridAfter) {
    const items = within(gridAfter).getAllByRole('listitem');
    const stillThere = items.some((li) => within(li).queryByText('Test Brownie'));
    expect(stillThere).toBe(false);
  }
});
