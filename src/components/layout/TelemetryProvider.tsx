"use client";

import "@/lib/telemetry-browser";

export function TelemetryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
