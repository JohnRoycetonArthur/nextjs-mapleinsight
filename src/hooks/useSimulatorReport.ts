'use client';

import { useEffect, useState, useCallback } from 'react';

export const REPORT_KEY = 'mi_simulator_report_v1';
export const REPORT_EVENT = 'mi:simulatorreport';

/** Dispatch after any localStorage read/write for the report key so same-tab listeners update. */
export function dispatchReportChange() {
  try {
    window.dispatchEvent(new CustomEvent(REPORT_EVENT));
  } catch { /* ignore */ }
}

/**
 * Returns whether a simulator report is saved in localStorage.
 * Updates reactively when the report is written or cleared — within the same
 * tab (via custom event) or across tabs (via the native storage event).
 */
export function useSimulatorReport() {
  const [hasReport, setHasReport] = useState(false);

  const sync = useCallback(() => {
    try {
      setHasReport(!!localStorage.getItem(REPORT_KEY));
    } catch {
      setHasReport(false);
    }
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(REPORT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(REPORT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);

  const clearReport = useCallback(() => {
    try {
      localStorage.removeItem(REPORT_KEY);
    } catch { /* ignore */ }
    dispatchReportChange();
  }, []);

  return { hasReport, clearReport };
}
