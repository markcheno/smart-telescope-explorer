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
import { ComparisonTray } from './components/ComparisonTray.js';
import { ScenarioSection } from './features/ScenarioSection.js';
import { OpticsSection } from './features/OpticsSection.js';
import { CameraSection } from './features/CameraSection.js';
import { MountSection } from './features/MountSection.js';
import { TrackingSection } from './features/TrackingSection.js';
import { OverviewView } from './analysis/OverviewView.js';
import { FramingView } from './analysis/FramingView.js';
import { SamplingView } from './analysis/SamplingView.js';
import { TrackingView } from './analysis/TrackingView.js';
import { BlurView } from './analysis/BlurView.js';
import { FieldRotationView } from './analysis/FieldRotationView.js';
import { ExposureView } from './analysis/ExposureView.js';
import { SensitivityView } from './analysis/SensitivityView.js';

type AnalysisTab =
  | 'overview'
  | 'framing'
  | 'sampling'
  | 'tracking'
  | 'blur'
  | 'rotation'
  | 'exposure'
  | 'sensitivity';

const TABS: { id: AnalysisTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'framing', label: 'Framing' },
  { id: 'sampling', label: 'Sampling' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'blur', label: 'Blur' },
  { id: 'rotation', label: 'Rotation' },
  { id: 'exposure', label: 'Exposure' },
  { id: 'sensitivity', label: 'Sensitivity' },
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
          <MountSection />
          <TrackingSection />
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
            {tab === 'tracking' && <TrackingView />}
            {tab === 'blur' && <BlurView />}
            {tab === 'rotation' && <FieldRotationView />}
            {tab === 'exposure' && <ExposureView />}
            {tab === 'sensitivity' && <SensitivityView />}
          </div>
        </main>

        <ResultsRail />
      </div>
      <ComparisonTray />
    </div>
  );
}
