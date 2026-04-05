"use client";

import { ApplicationInsights } from "@microsoft/applicationinsights-web";

const CONNECTION_STRING =
  "InstrumentationKey=391f1c77-970f-4431-b3d1-a6e4d006b8fa;IngestionEndpoint=https://westus2-2.in.applicationinsights.azure.com/;LiveEndpoint=https://westus2.livediagnostics.monitor.azure.com/;ApplicationId=02dc2a93-05bf-4a2b-b75f-e7ab15634533";

let appInsights: ApplicationInsights | null = null;

if (typeof window !== "undefined") {
  appInsights = new ApplicationInsights({
    config: {
      connectionString: CONNECTION_STRING,
      enableAutoRouteTracking: true,
      disableFetchTracking: false,
      disableAjaxTracking: false,
    },
  });
  appInsights.loadAppInsights();
  appInsights.trackPageView();
}

export function trackClientEvent(
  name: string,
  properties?: Record<string, string>,
  measurements?: Record<string, number>
): void {
  appInsights?.trackEvent({ name, properties, measurements });
}
