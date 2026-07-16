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

function openSection(title: string): HTMLElement {
  const header = screen.getByRole('button', { name: new RegExp(title, 'i') });
  fireEvent.click(header);
  return header.closest('section')!;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('power section (#7, v0.4 §33)', () => {
  it('adds a load and shows a runtime estimate', () => {
    renderApp();
    const section = openSection('Power');
    fireEvent.click(within(section).getByRole('button', { name: 'Add load' }));
    // A watts field appears; set battery capacity and expect a runtime.
    const watts = within(section).getByLabelText('Load 1 watts');
    fireEvent.change(watts, { target: { value: '10' } });
    const battery = within(section).getByLabelText(/Battery capacity/);
    fireEvent.change(battery, { target: { value: '100' } });
    fireEvent.blur(battery);
    // 100·0.8·0.9 = 72 Wh / 10 W = 7.2 h.
    expect(within(section).getByText(/7\.2 hr/)).toBeTruthy();
  });
});

describe('focus section (#7, v0.4 §11)', () => {
  it('computes the critical focus zone from the optics', () => {
    renderApp();
    const section = openSection('Focus');
    // CFZ derives from the default 30 mm f/5.33 optics (160/30):
    // 2·0.55·5.333² ≈ 31.3 µm.
    const travel = within(section).getByLabelText(/Travel \/ revolution/);
    fireEvent.change(travel, { target: { value: '400' } });
    fireEvent.blur(travel);
    expect(within(section).getByText(/31\.3 µm/)).toBeTruthy();
  });
});
