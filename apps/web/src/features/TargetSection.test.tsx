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

describe('target browser (#5, spec v0.7 §8/§23)', () => {
  it('searches the catalog and selects a catalog target', () => {
    renderApp();
    const list = screen.getByLabelText('Catalog targets');
    // Full catalog is present before filtering.
    expect(within(list).getByText('Andromeda Galaxy')).toBeTruthy();
    expect(within(list).getByText('Orion Nebula')).toBeTruthy();

    // Search narrows by name/alias/id.
    fireEvent.change(screen.getByPlaceholderText(/catalog id/i), { target: { value: 'M31' } });
    expect(within(list).getByText('Andromeda Galaxy')).toBeTruthy();
    expect(within(list).queryByText('Orion Nebula')).toBeNull();

    // Selecting M31 makes it the current target (name + catalog provenance
    // badge) and drives a fresh framing verdict.
    fireEvent.click(within(list).getByText('Andromeda Galaxy'));
    expect(screen.getByText('Andromeda Galaxy', { selector: '.target__name' })).toBeTruthy();
    expect(screen.getByText('catalog', { selector: '.target__badge' })).toBeTruthy();
    // The results rail shows a target-fit verdict for the newly selected target.
    const rail = screen.getByLabelText('Results');
    expect(within(rail).getByText(/Target fit/)).toBeTruthy();
  });

  it('filters by object type', () => {
    renderApp();
    const list = screen.getByLabelText('Catalog targets');
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'galaxy' } });
    expect(within(list).getByText('Andromeda Galaxy')).toBeTruthy();
    // Emission nebula is filtered out.
    expect(within(list).queryByText('North America Nebula')).toBeNull();
  });
});
