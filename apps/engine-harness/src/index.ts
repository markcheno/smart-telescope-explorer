/**
 * @ste/engine-harness — minimal development harness (spec v0.9 §23 R0-018).
 *
 * Loads a fixture (or a raw JSON design), runs the engine over the requested
 * groups, and prints results, issues, assumptions, and (optionally) formulas.
 * This is a developer tool, not part of the pure engine, so it may read files
 * and the clock.
 *
 * Usage:
 *   pnpm harness                       # F01, all groups
 *   pnpm harness F02                   # a named fixture
 *   pnpm harness --file design.json    # a raw design document
 *   pnpm harness F01 --groups static_geometry,sampling
 *   pnpm harness F01 --formulas        # also print formula records
 */

import { readFileSync } from 'node:fs';
import { calculate } from '@ste/engine-core';
import {
  F01_DOCUMENT,
  F02_DOCUMENT,
  F03_DOCUMENT,
  F04_DOCUMENT,
  F05_DOCUMENT,
  F06_DOCUMENT,
  F07_DOCUMENT,
  fixtureRequest,
} from '@ste/test-fixtures';
import type { CalculationGroup, DesignDocument, ResultGroups, ResultValue } from '@ste/schema';

const FIXTURES: Record<string, DesignDocument> = {
  F01: F01_DOCUMENT,
  F02: F02_DOCUMENT,
  F03: F03_DOCUMENT,
  F04: F04_DOCUMENT,
  F05: F05_DOCUMENT,
  F06: F06_DOCUMENT,
  F07: F07_DOCUMENT,
};

interface Args {
  fixture: string;
  file?: string;
  groups: CalculationGroup[];
  showFormulas: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { fixture: 'F01', groups: ['all'], showFormulas: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--file') {
      const next = argv[++i];
      if (next != null) args.file = next;
    } else if (arg === '--groups') {
      args.groups = (argv[++i] ?? '').split(',').filter(Boolean) as CalculationGroup[];
    } else if (arg === '--formulas') {
      args.showFormulas = true;
    } else if (arg != null && !arg.startsWith('--')) {
      args.fixture = arg;
    }
  }
  return args;
}

function loadDesign(args: Args): DesignDocument {
  if (args.file != null) {
    return JSON.parse(readFileSync(args.file, 'utf8')) as DesignDocument;
  }
  const doc = FIXTURES[args.fixture.toUpperCase()];
  if (doc == null) {
    throw new Error(
      `Unknown fixture "${args.fixture}". Known: ${Object.keys(FIXTURES).join(', ')}.`,
    );
  }
  return doc;
}

function fmt(value: ResultValue<unknown>['value']): string {
  if (value == null) return 'unknown';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(4);
  }
  return String(value);
}

function printGroup(name: string, group: Record<string, ResultValue<unknown>>): void {
  console.log(`\n▸ ${name}`);
  for (const [key, rv] of Object.entries(group)) {
    const unit = rv.unit ? ` ${rv.unit}` : '';
    const conf = rv.confidence ? `  [${rv.confidence.level}]` : '';
    const flag = rv.status === 'valid' ? ' ' : rv.status === 'unavailable' ? '·' : '!';
    console.log(`  ${flag} ${key.padEnd(32)} ${fmt(rv.value)}${unit}${conf}`);
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const design = loadDesign(args);
  const startedAt = new Date().toISOString();
  const response = calculate(fixtureRequest(design, args.groups), {
    startedAt,
    completedAt: new Date().toISOString(),
  });

  console.log(`Design:  ${design.metadata.name} (${design.design_id} r${design.revision})`);
  console.log(`Status:  ${response.status}`);
  console.log(`Groups:  ${response.calculated_groups.join(', ') || '(none)'}`);

  const resultKeys = Object.keys(response.results) as (keyof ResultGroups)[];
  for (const key of resultKeys) {
    const group = response.results[key];
    if (group != null && !Array.isArray(group)) {
      printGroup(key, group as unknown as Record<string, ResultValue<unknown>>);
    }
  }

  if (response.issues.length > 0) {
    console.log('\n▸ issues');
    for (const issue of response.issues) {
      console.log(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  if (response.assumptions.length > 0) {
    console.log('\n▸ assumptions');
    for (const a of response.assumptions) {
      console.log(`  ${a.assumption_id} (${a.confidence}): ${a.title}`);
    }
  }

  if (args.showFormulas && response.formulas != null) {
    console.log('\n▸ formulas');
    for (const f of response.formulas) {
      const sub = f.substituted_expression ? ` = ${f.substituted_expression}` : '';
      console.log(`  ${f.formula_id}: ${f.symbolic_expression}${sub} → ${fmt(f.result_value)}`);
    }
  }
}

main();
