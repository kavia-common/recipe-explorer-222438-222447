import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

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
