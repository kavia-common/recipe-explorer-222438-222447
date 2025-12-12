import { render, screen } from '@testing-library/react';
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
