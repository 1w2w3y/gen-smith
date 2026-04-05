import * as appInsights from "applicationinsights";

const CONNECTION_STRING =
  "InstrumentationKey=391f1c77-970f-4431-b3d1-a6e4d006b8fa;IngestionEndpoint=https://westus2-2.in.applicationinsights.azure.com/;LiveEndpoint=https://westus2.livediagnostics.monitor.azure.com/;ApplicationId=02dc2a93-05bf-4a2b-b75f-e7ab15634533";

appInsights
  .setup(CONNECTION_STRING)
  .setAutoCollectRequests(false)
  .setAutoCollectDependencies(true)
  .setAutoCollectExceptions(true)
  .setAutoCollectConsole(false)
  .setAutoCollectPerformance(false, false)
  .start();

const client = appInsights.defaultClient;
client.context.tags[client.context.keys.cloudRole] = "gen-smith";

export function trackGeneration(
  name: string,
  properties: Record<string, string>,
  measurements: Record<string, number>
): void {
  client.trackEvent({ name, properties, measurements });
}

export function trackException(
  error: Error,
  properties?: Record<string, string>
): void {
  client.trackException({ exception: error, properties });
}
