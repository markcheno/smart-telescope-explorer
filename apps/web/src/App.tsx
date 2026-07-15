/**
 * Application shell (spec v0.9 §3, §24 R1-001).
 *
 * Three-pane workspace: input navigator (left), analysis workspace (centre with
 * Overview/Framing/Sampling tabs), and the persistent results rail (right), plus
 * a collapsed comparison-tray placeholder. Keyboard-accessible throughout.
 */

import { useState } from 'react';
import { AppBar } from './components/AppBar.js';
import { ResultsRail } from './components/ResultsRail.js';
import { ScenarioSection } from './features/ScenarioSection.js';
import { OpticsSection } from './features/OpticsSection.js';
import { CameraSection } from './features/CameraSection.js';
import { OverviewView } from './analysis/OverviewView.js';
import { FramingView } from './analysis/FramingView.js';
import { SamplingView } from './analysis/SamplingView.js';

type AnalysisTab = 'overview' | 'framing' | 'sampling';

const TABS: { id: AnalysisTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'framing', label: 'Framing' },
  { id: 'sampling', label: 'Sampling' },
];

export function App(): JSX.Element {
  const [tab, setTab] = useState<AnalysisTab>('overview');

  return (
    <div className="app">
      <AppBar />
      <div className="app__body">
        <nav className="inputs" aria-label="Inputs">
          <div className="inputs__title">Inputs</div>
          <ScenarioSection />
          <OpticsSection />
          <CameraSection />
        </nav>

        <main className="analysis" aria-label="Analysis">
          <div className="analysis__tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`analysis__tab ${tab === t.id ? 'analysis__tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="analysis__panel" role="tabpanel">
            {tab === 'overview' && <OverviewView />}
            {tab === 'framing' && <FramingView />}
            {tab === 'sampling' && <SamplingView />}
          </div>
        </main>

        <ResultsRail />
      </div>
      <footer className="tray" aria-label="Comparison tray">
        Comparison tray · 0 pinned designs
      </footer>
    </div>
  );
}
