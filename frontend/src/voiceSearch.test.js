import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeEach(() => {
  try { window.localStorage.clear(); } catch {}
  window.location.hash = '#/';
  // Reset any mocks
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
});

test('mic button renders next to search', async () => {
  render(<App />);
  const input = await screen.findByLabelText('Search input');
  expect(input).toBeInTheDocument();
  // Button accessible label should be Start voice search initially
  const mic = await screen.findByRole('button', { name: /start voice search/i });
  expect(mic).toBeInTheDocument();
});

test('clicking mic toggles recording state and stop label', async () => {
  // Mock SpeechRecognition
  class MockSR {
    constructor() {
      this.lang = 'en-US';
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
    }
    start() {
      // simulate active, will end after short timeout
      setTimeout(() => {
        if (this.onend) this.onend();
      }, 20);
    }
    stop() {
      if (this.onend) this.onend();
    }
  }
  window.SpeechRecognition = MockSR;

  render(<App />);

  const mic = await screen.findByRole('button', { name: /start voice search/i });
  fireEvent.click(mic);

  // During recording, aria-label should switch to stop
  const stopBtn = await screen.findByRole('button', { name: /stop voice search/i });
  expect(stopBtn).toBeInTheDocument();

  await act(async () => { await wait(40); });

  // After end, should return to start label
  const startBtn = await screen.findByRole('button', { name: /start voice search/i });
  expect(startBtn).toBeInTheDocument();
});

test('mock transcript sets the search input value (debounced filtering remains)', async () => {
  // Mock SpeechRecognition to emit a transcript
  class MockSR {
    constructor() {
      this.lang = 'en-US';
    }
    start() {
      const e = { results: [ [ { transcript: 'pasta' } ] ] };
      if (this.onresult) this.onresult(e);
      if (this.onend) this.onend();
    }
    stop() {
      if (this.onend) this.onend();
    }
  }
  window.webkitSpeechRecognition = MockSR;

  render(<App />);

  const mic = await screen.findByRole('button', { name: /start voice search/i });
  fireEvent.click(mic);

  const input = await screen.findByLabelText('Search input');
  // Debounced logic updates filtering, but input value should be immediate to controlled component
  expect(input).toHaveValue('pasta');

  await act(async () => { await wait(250); });
  // Basic assertion grid still present
  expect(await screen.findByRole('list')).toBeInTheDocument();
});

test('shows fallback toast when API is absent', async () => {
  render(<App />);
  const mic = await screen.findByRole('button', { name: /start voice search/i });
  // Ensure API is not defined
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;

  fireEvent.click(mic);

  // Expect a friendly toast; title or body text should appear
  const toastTitle = await screen.findByText(/Voice search not available/i);
  expect(toastTitle).toBeInTheDocument();
});
