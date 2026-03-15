'use client';

import { useEffect } from 'react';
import type { WizardState } from '@/components/simulator/wizardTypes';

const STORAGE_KEY = 'maple-simulator-v1';

/** Restores wizard state from sessionStorage on mount. */
export function useRestoreSimulatorState(
  setState: (s: WizardState) => void,
): void {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as WizardState);
    } catch {
      // Ignore parse/access errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Persists wizard state to sessionStorage on every change. */
export function usePersistSimulatorState(state: WizardState): void {
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota/access errors
    }
  }, [state]);
}

/** Clears simulator state from sessionStorage (call after run). */
export function clearSimulatorState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
