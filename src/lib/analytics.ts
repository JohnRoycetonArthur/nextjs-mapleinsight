/**
 * Analytics event tracking utility for Maple Insight.
 * Fires events via gtag (Google Analytics 4) or Plausible if available.
 * All events respect the site's cookie/privacy consent mechanism.
 */
type WindowWithAnalytics = Window & {
  gtag?: (...args: unknown[]) => void;
  plausible?: (name: string, options?: { props?: Record<string, unknown> }) => void;
};

export function trackEvent(
  name: string,
  props: Record<string, string | number> = {}
) {
  if (typeof window === "undefined") return;

  const w = window as WindowWithAnalytics;

  // Google Analytics 4
  if (typeof w.gtag === "function") {
    w.gtag("event", name, props);
  }

  // Plausible Analytics
  if (typeof w.plausible === "function") {
    w.plausible(name, { props });
  }
}
