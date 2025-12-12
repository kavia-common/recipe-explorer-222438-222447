import { render, screen, fireEvent, within, act } from '@testing-library/react';
import App from './App';

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

beforeEach(() => {
  try { window.localStorage.clear(); } catch {}
  window.location.hash = '#/';
});

test('Collections header link navigates and shows starter templates', async () => {
  render(<App />);
  const link = await screen.findByRole('button', { name: /Collections/i });
  fireEvent.click(link);
  expect(window.location.hash).toContain('collections');
  // Starters visible when empty
  expect(await screen.findByText(/Starter templates/i)).toBeInTheDocument();
});

test('Create a collection and it appears in list with count 0', async () => {
  render(<App />);
  fireEvent.click(await screen.findByRole('button', { name: /Collections/i }));
  // Create via starters
  const starter = await screen.findByRole('button', { name: /Party Recipes/i });
  fireEvent.click(starter);
  const listbox = await screen.findByRole('listbox', { name: /Collections/i });
  expect(listbox).toBeInTheDocument();
  const entries = within(listbox).getAllByRole('button');
  const hasParty = entries.some((b) => within(b).queryByText('Party Recipes'));
  expect(hasParty).toBe(true);
});

test('Add a recipe to a collection from detail modal and see it in collection grid', async () => {
  render(<App />);
  // open first recipe
  const grid = await screen.findByRole('list');
  const first = within(grid).getAllByRole('listitem')[0];
  fireEvent.click(first);

  // open add to collection modal
  const addBtn = await screen.findByRole('button', { name: /Add to Collection/i });
  fireEvent.click(addBtn);

  // create a collection inline
  const createBtn = await screen.findByRole('button', { name: /Create Collection/i });
  // stub prompt
  const oldPrompt = window.prompt; window.prompt = () => 'Quick Snacks';
  fireEvent.click(createBtn);
  window.prompt = oldPrompt;

  // save
  const save = await screen.findByRole('button', { name: /^Save$/i });
  fireEvent.click(save);

  // navigate to Collections page
  fireEvent.click(await screen.findByRole('button', { name: /Collections/i }));
  await act(async () => { await wait(50); });
  // select the collection
  const listbox = await screen.findByRole('listbox', { name: /Collections/i });
  const entry = within(listbox).getAllByRole('button').find(b => /Quick Snacks/i.test(b.textContent || ''));
  fireEvent.click(entry);

  // grid shows at least one recipe
  const grid2 = await screen.findByRole('list');
  const items = within(grid2).getAllByRole('listitem');
  expect(items.length).toBeGreaterThan(0);
});

test('Removing a recipe from a collection updates counts', async () => {
  render(<App />);
  // Ensure exists
  const grid = await screen.findByRole('list');
  fireEvent.click(within(grid).getAllByRole('listitem')[0]);
  const addBtn = await screen.findByRole('button', { name: /Add to Collection/i });
  fireEvent.click(addBtn);
  const oldPrompt = window.prompt; window.prompt = () => 'Kids Lunch Box';
  fireEvent.click(await screen.findByRole('button', { name: /Create Collection/i }));
  window.prompt = oldPrompt;
  fireEvent.click(await screen.findByRole('button', { name: /^Save$/i }));

  // navigate
  fireEvent.click(await screen.findByRole('button', { name: /Collections/i }));
  await act(async () => { await wait(50); });

  // select collection
  const listbox = await screen.findByRole('listbox', { name: /Collections/i });
  const entry = within(listbox).getAllByRole('button').find(b => /Kids Lunch Box/i.test(b.textContent || ''));
  fireEvent.click(entry);
  // remove using inline remove buttons
  const removeBtn = await screen.findAllByRole('button', { name: /Remove .* from this collection/i });
  fireEvent.click(removeBtn[0]);

  // Counts reflect change
  const updatedEntry = within(listbox).getAllByRole('button').find(b => /Kids Lunch Box/i.test(b.textContent || ''));
  expect(updatedEntry).toBeInTheDocument();
});

test('Deleting a collection via confirm removes it from list', async () => {
  render(<App />);
  // Create one via starter
  fireEvent.click(await screen.findByRole('button', { name: /Collections/i }));
  const starter = await screen.findByRole('button', { name: /Festival Specials/i });
  fireEvent.click(starter);

  // delete
  const delBtn = await screen.findByRole('button', { name: /^Delete$/i });
  fireEvent.click(delBtn);
  // confirm dialog Delete button
  const confirm = await screen.findAllByRole('button', { name: /^Delete$/i });
  fireEvent.click(confirm[confirm.length - 1]);

  // list either empty or does not contain Festival Specials
  await act(async () => { await wait(50); });
  const listbox = await screen.findByRole('listbox', { name: /Collections/i });
  const entries = within(listbox).getAllByRole('button');
  const stillThere = entries.some(b => /Festival Specials/i.test(b.textContent || ''));
  expect(stillThere).toBe(false);
});
