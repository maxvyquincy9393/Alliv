import * as Sentry from '@sentry/react';
import type { Metric } from 'web-vitals';
import { onCLS, onFID, onLCP } from 'web-vitals';
import { config } from '../config';

const shouldReportMetrics = config.nodeEnv === 'production';

const sendToAnalytics = (metric: Metric) => {
  if (!shouldReportMetrics) return;

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    page: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(config.metricsUrl, payload);
    return;
  }

  fetch(config.metricsUrl, {
    method: 'POST',
    body: payload,
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {
    // swallow network errors
  });
};

const initSentry = () => {
  if (!config.sentryDsn) return;

  Sentry.init({
    dsn: config.sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllInputs: false, blockAllMedia: false }),
    ],
    tracesSampleRate: config.nodeEnv === 'production' ? 0.2 : 0,
    replaysSessionSampleRate: config.nodeEnv === 'production' ? 0.05 : 0,
    replaysOnErrorSampleRate: 1.0,
  });
};

export const initMonitoring = () => {
  initSentry();
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
};

