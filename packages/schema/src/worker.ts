/**
 * Worker protocol (spec v0.8 §30).
 *
 * The calculation engine runs off the main thread. A response is accepted only
 * when design id, revision, worker generation, and active request all match
 * (v0.8 §30, §48.8) — the guard against a stale worker overwriting fresh state.
 */

import type { CalculationRequest, CalculationResponse } from './calculation.js';

export const WORKER_PROGRESS_PHASES = [
  'validating',
  'static_geometry',
  'scenario_geometry',
  'kinematics',
  'tracking',
  'blur',
  'exposure_sweep',
  'session',
  'recommendations',
  'finalizing',
] as const;
export type WorkerProgressPhase = (typeof WORKER_PROGRESS_PHASES)[number];

/** Fields common to every worker message in both directions (v0.8 §30). */
export interface WorkerMessageBase {
  request_id: string;
  worker_generation: number;
  /** ISO 8601 timestamp. */
  sent_at: string;
}

// --- app -> worker --------------------------------------------------------

export interface InitializeWorkerMessage extends WorkerMessageBase {
  message_type: 'initialize_worker';
  engine_version: string;
  schema_version: string;
}

export interface CalculateDesignMessage extends WorkerMessageBase {
  message_type: 'calculate_design';
  request: CalculationRequest;
}

export interface PreviewRecommendationMessage extends WorkerMessageBase {
  message_type: 'preview_recommendation';
  design_id: string;
  design_revision: number;
  recommendation_id: string;
}

export interface CancelRequestMessage extends WorkerMessageBase {
  message_type: 'cancel_request';
  /** Request id to cancel. */
  target_request_id: string;
}

export interface ClearCacheMessage extends WorkerMessageBase {
  message_type: 'clear_cache';
}

export interface PingMessage extends WorkerMessageBase {
  message_type: 'ping';
}

export type AppToWorkerMessage =
  | InitializeWorkerMessage
  | CalculateDesignMessage
  | PreviewRecommendationMessage
  | CancelRequestMessage
  | ClearCacheMessage
  | PingMessage;

// --- worker -> app --------------------------------------------------------

export interface WorkerReadyMessage extends WorkerMessageBase {
  message_type: 'worker_ready';
  engine_version: string;
  schema_version: string;
}

export interface CalculationProgressMessage extends WorkerMessageBase {
  message_type: 'calculation_progress';
  phase: WorkerProgressPhase;
  /** 0..1 overall progress, if known. */
  fraction?: number | null;
}

export interface CalculationResultMessage extends WorkerMessageBase {
  message_type: 'calculation_result';
  result: CalculationResponse;
}

export interface RecommendationPreviewResultMessage extends WorkerMessageBase {
  message_type: 'recommendation_preview_result';
  recommendation_id: string;
  /** Preview payload shape is defined with the preview contract (v0.8 §28). */
  preview: Record<string, unknown>;
}

export interface RequestCancelledMessage extends WorkerMessageBase {
  message_type: 'request_cancelled';
  target_request_id: string;
}

export interface WorkerErrorMessage extends WorkerMessageBase {
  message_type: 'worker_error';
  /** Safe, non-sensitive error code. */
  code: string;
  message: string;
  diagnostic_id?: string;
  retryable: boolean;
}

export interface PongMessage extends WorkerMessageBase {
  message_type: 'pong';
}

export type WorkerToAppMessage =
  | WorkerReadyMessage
  | CalculationProgressMessage
  | CalculationResultMessage
  | RecommendationPreviewResultMessage
  | RequestCancelledMessage
  | WorkerErrorMessage
  | PongMessage;

export type WorkerMessage = AppToWorkerMessage | WorkerToAppMessage;
