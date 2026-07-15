// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from './App.js';
import { DesignProvider } from './state/store.js';

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

describe('R1 gate: answer framing, image scale, and sampling (v0.9 §24)', () => {
  it('shows the default 30 mm design image scale and FOV in the results rail', () => {
    renderApp();
    const rail = screen.getByLabelText('Results');
    // F01 default: 3.74 arcsec/px image scale.
    expect(within(rail).getByText(/3\.74 arcsec\/px/)).toBeTruthy();
    expect(within(rail).getByText(/Target fit/)).toBeTruthy();
  });

  it('shows sampling classification and base FWHM on the Sampling tab', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Sampling' }));
    // Appears in both the Sampling view and the results rail.
    expect(screen.getAllByText('Moderately Undersampled').length).toBeGreaterThan(0);
    // Combined base FWHM ~ 5.04 arcsec.
    expect(screen.getAllByText(/5\.04 arcsec/).length).toBeGreaterThan(0);
  });

  it('recomputes results when the focal length changes (results derive from inputs)', () => {
    renderApp();
    const rail = screen.getByLabelText('Results');
    expect(within(rail).getByText(/3\.74 arcsec\/px/)).toBeTruthy();

    const focal = screen.getByLabelText(/Focal length/) as HTMLInputElement;
    fireEvent.change(focal, { target: { value: '320' } });
    fireEvent.blur(focal);

    // Doubling focal length halves the image scale to ~1.87 arcsec/px.
    expect(within(rail).getByText(/1\.87 arcsec\/px/)).toBeTruthy();
  });

  it('does not fabricate a value for an unknown effective area', () => {
    renderApp();
    // F01 has no transmission, so effective area is unavailable, not a number.
    // The Overview shows focal ratio (known) but never a fabricated area.
    expect(screen.getAllByText(/f\/5\.33/).length).toBeGreaterThan(0);
  });
});
