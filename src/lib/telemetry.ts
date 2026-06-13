import * as appInsights from "applicationinsights";
import type { TelemetryClient } from "applicationinsights";

let client: TelemetryClient | null | undefined;

function getConnectionString(): string | undefined {
  return (
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING ||
    process.env.NEXT_PUBLIC_APPLICATIONINSIGHTS_CONNECTION_STRING
  );
}

function getClient(): TelemetryClient | null {
  if (client !== undefined) return client;

  const connectionString = getConnectionString();
  if (!connectionString) {
    client = null;
    return client;
  }

  try {
    appInsights
      .setup(connectionString)
      .setAutoCollectRequests(false)
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectConsole(false)
      .setAutoCollectPerformance(false, false);

    appInsights.start();
    client = appInsights.defaultClient;
    client.config.samplingPercentage = 100;
    client.context.tags[client.context.keys.cloudRole] = "gen-smith";
  } catch (error) {
    console.warn("[telemetry] Failed to initialize Application Insights", error);
    client = null;
  }

  return client;
}

export function trackGeneration(
  name: string,
  properties: Record<string, string>,
  measurements: Record<string, number>
): void {
  getClient()?.trackEvent({ name, properties, measurements });
}

export function trackException(
  error: Error,
  properties?: Record<string, string>
): void {
  getClient()?.trackException({ exception: error, properties });
}
