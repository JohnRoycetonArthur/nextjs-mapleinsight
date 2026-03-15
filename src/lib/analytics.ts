/**
 * Shared analytics utility for Maple Insight Canada.
 * Events are pushed into window.dataLayer and forwarded to GA4 through GTM.
 */
type AnalyticsValue = string | number | boolean | null | undefined;

type AnalyticsProps = Record<string, AnalyticsValue>;

type DataLayerEvent = {
  event: string;
} & Record<string, string | number | boolean | null>;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

function sanitizeProps(props: AnalyticsProps): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean | null>;
}

export function pushToDataLayer(event: DataLayerEvent) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function trackEvent(name: string, props: AnalyticsProps = {}) {
  pushToDataLayer({
    event: name,
    ...sanitizeProps(props),
  });
}
