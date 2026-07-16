// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App.js';
import { DesignProvider } from '../state/store.js';

function renderApp() {
  return render(
    <DesignProvider>
      <App />
    </DesignProvider>,
  );
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('report view (#6, spec v0.7 §18 / v0.8 §44)', () => {
  it('renders the report with cover, summary, and sections', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Report' }));
    expect(screen.getByText('Executive summary')).toBeTruthy();
    expect(screen.getByText('System overview')).toBeTruthy();
    expect(screen.getByText('Framing & sampling')).toBeTruthy();
    // v1 is relative-SNR only, so the limitation is always listed in the summary.
    const summary = screen.getByText('Executive summary').closest('section')!;
    expect(within(summary).getByText(/signal-to-noise is relative/i)).toBeTruthy();
  });

  it('applies the location-privacy selector to coordinates', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Report' }));
    const framing = screen.getByText('Framing & sampling').closest('section')!;

    // Default is exact — the F01 default target has no coordinates, so it reads
    // "unknown"; select "Removed" and it must read "withheld".
    fireEvent.change(screen.getByLabelText('Coordinates'), { target: { value: 'removed' } });
    expect(within(framing).getByText('withheld')).toBeTruthy();
  });
});
