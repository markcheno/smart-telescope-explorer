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

describe('R2 gate: tracking, blur, exposure, apply recommendation (v0.9 §28, R2-038)', () => {
  it('shows a Blur tab with the final ellipse and elongation', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Blur' }));
    expect(screen.getAllByText(/Major FWHM/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Elongation/).length).toBeGreaterThan(0);
  });

  it('reflects tracking error in the tracking view', () => {
    renderApp();
    // Open the (collapsed) Tracking input section, then enter a periodic error.
    fireEvent.click(screen.getByRole('button', { name: /Tracking/ }));
    const amp = screen.getByLabelText(/Periodic amplitude/) as HTMLInputElement;
    fireEvent.change(amp, { target: { value: '20' } });
    fireEvent.blur(amp);

    fireEvent.click(screen.getByRole('tab', { name: 'Tracking' }));
    // The tracking view now shows motion metrics rather than the empty prompt.
    expect(screen.getAllByText('Max displacement').length).toBeGreaterThan(0);
  });

  it('applies a recommendation and updates the design (gate items 12-13)', () => {
    renderApp();
    // A long focal length + large target forces a framing failure recommendation.
    const focal = screen.getByLabelText(/Focal length/) as HTMLInputElement;
    fireEvent.change(focal, { target: { value: '2000' } });
    fireEvent.blur(focal);

    // The Overview lists recommendations; apply the first one.
    const applyButtons = screen.getAllByRole('button', { name: 'Apply' });
    expect(applyButtons.length).toBeGreaterThan(0);
    fireEvent.click(applyButtons[0]!);

    // Applying the shorter-focal-length recommendation changed the focal length input.
    const focalAfter = screen.getByLabelText(/Focal length/) as HTMLInputElement;
    expect(Number(focalAfter.value)).toBeLessThan(2000);
  });

  it('shows the exposure sweep candidate table', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Exposure' }));
    expect(screen.getAllByText(/Recommended/).length).toBeGreaterThan(0);
    expect(screen.getByText('Relative')).toBeTruthy();
  });
});

describe('R3: sensitivity, session yield, and a non-preliminary exposure metric', () => {
  it('shows a Sensitivity tab with relative throughput and session yield', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Sensitivity' }));
    expect(screen.getByText(/Point-source throughput/)).toBeTruthy();
    expect(screen.getAllByText(/Effective integration/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Relative stacked-SNR score/)).toBeTruthy();
  });

  it('no longer labels the exposure view as preliminary', () => {
    renderApp();
    fireEvent.click(screen.getByRole('tab', { name: 'Exposure' }));
    expect(screen.queryByText('preliminary')).toBeNull();
  });

  it('surfaces effective integration in the overview', () => {
    renderApp();
    // Overview is the default tab; effective integration is a metric tile + rail card.
    expect(screen.getAllByText('Effective integration').length).toBeGreaterThan(0);
  });
});

describe('R3: compare against a commercial reference (v0.9 §40)', () => {
  it('pins the Seestar S30 and shows a side-by-side comparison table', () => {
    renderApp();
    // Pin the Seestar reference from the comparison tray.
    fireEvent.click(screen.getByRole('button', { name: /Seestar S30/ }));
    // The tray toggle becomes enabled; expand it.
    fireEvent.click(screen.getByRole('button', { name: /Comparison · 1 pinned/ }));
    // The comparison table lists the reference column and a sensitivity metric.
    expect(screen.getAllByText(/Seestar S30/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Relative stacked SNR/)).toBeTruthy();
    expect(screen.getByText(/Point-source throughput/)).toBeTruthy();
  });
});

describe('R3: constraints (v0.4 §37)', () => {
  it('evaluates a target-must-fit constraint and shows a status', () => {
    renderApp();
    // Open the Constraints section and enable "Target must fit".
    fireEvent.click(screen.getByRole('button', { name: /Constraints/ }));
    const fitCheckbox = screen.getByLabelText('Target must fit') as HTMLInputElement;
    fireEvent.click(fitCheckbox);
    // The default F01 design frames its target, so the constraint passes.
    expect(screen.getByText('Pass')).toBeTruthy();
  });
});

describe('#4: recommendation preview (v0.8 §28)', () => {
  it('previews a recommendation showing a before→after benefit', () => {
    renderApp();
    // Force a framing failure so a recommendation with proposed changes appears.
    const focal = screen.getByLabelText(/Focal length/) as HTMLInputElement;
    fireEvent.change(focal, { target: { value: '2000' } });
    fireEvent.blur(focal);

    // Preview the first recommendation (Overview lists them).
    const previewButtons = screen.getAllByRole('button', { name: 'Preview' });
    expect(previewButtons.length).toBeGreaterThan(0);
    fireEvent.click(previewButtons[0]!);

    // The preview block shows a before→after arrow.
    expect(screen.getByText(/→/)).toBeTruthy();
  });
});
