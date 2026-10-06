/**
 * File: src/api/useAsync.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-10-03
 * Work-item: W1.1 — Port typed BFF client from valtide-ui into valtide-web-ui2.
 * Description:
 *   Small reusable loading/error-state scaffolding so Waves 2-3 can wire the
 *   typed client (client.ts) into each page with consistent idle/loading/
 *   success/error handling. Single Responsibility: UI async state ONLY — it
 *   knows nothing about the specific endpoint it runs, so the same hook drives
 *   scan, news-check and strategy. Keeps a typed mock fallback available to
 *   callers (passed in by the page) without baking it into this hook.
 */
import { useCallback, useRef, useState } from 'react';
import type { ApiError } from './types';

/** Discriminated async state for a single BFF request. */
export type AsyncState<T> =
  | { status: 'idle'; data: null; error: null }
  | { status: 'loading'; data: null; error: null }
  | { status: 'success'; data: T; error: null }
  | { status: 'error'; data: null; error: ApiError };

/** Return shape of {@link useAsync}. */
export interface UseAsync<T, A extends unknown[]> {
  /** Current async state (idle | loading | success | error). */
  state: AsyncState<T>;
  /** Convenience booleans derived from state. */
  isLoading: boolean;
  /** Run the wrapped operation; resolves with data or null on error. */
  run: (...args: A) => Promise<T | null>;
  /** Reset back to the idle state. */
  reset: () => void;
}

const IDLE = { status: 'idle', data: null, error: null } as const;

/** Normalize an unknown throwable into the sanitized ApiError envelope. */
function toApiError(err: unknown): ApiError {
  if (err && typeof err === 'object' && 'code' in err && 'message' in err) {
    return err as ApiError;
  }
  return {
    code: 'CLIENT_ERROR',
    message: err instanceof Error ? err.message : String(err),
    correlationId: 'local',
  };
}

/**
 * Wrap an async operation (typically a valtideApi method) in typed
 * loading/error state for a page component.
 *
 * @param fn The async operation to run.
 * @returns {@link UseAsync} handle with state + run/reset.
 */
export function useAsync<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
): UseAsync<T, A> {
  const [state, setState] = useState<AsyncState<T>>(IDLE);
  // Guard against setState after the latest run was superseded.
  const callId = useRef(0);

  const run = useCallback(
    async (...args: A): Promise<T | null> => {
      const id = ++callId.current;
      setState({ status: 'loading', data: null, error: null });
      try {
        const data = await fn(...args);
        if (id === callId.current) {
          setState({ status: 'success', data, error: null });
        }
        return data;
      } catch (err) {
        const error = toApiError(err);
        if (id === callId.current) {
          setState({ status: 'error', data: null, error });
        }
        console.warn('[useAsync] operation failed', error.code);
        return null;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    callId.current++;
    setState(IDLE);
  }, []);

  return { state, isLoading: state.status === 'loading', run, reset };
}
