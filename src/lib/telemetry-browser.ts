"use client";

import { ApplicationInsights } from "@microsoft/applicationinsights-web";

const CONNECTION_STRING =
  process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING;

let appInsights: ApplicationInsights | null = null;

if (typeof window !== "undefined" && CONNECTION_STRING) {
  try {
    appInsights = new ApplicationInsights({
      config: {
        connectionString: CONNECTION_STRING,
        enableAutoRouteTracking: true,
        disableFetchTracking: false,
        disableAjaxTracking: false,
        samplingPercentage: 100,
      },
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
  } catch (error) {
    console.warn("[telemetry] Failed to initialize Application Insights", error);
    appInsights = null;
  }
}

export function trackClientEvent(
  name: string,
  properties?: Record<string, string>,
  measurements?: Record<string, number>
): void {
  appInsights?.trackEvent({ name, properties, measurements });
}
