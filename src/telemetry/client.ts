import { OTEL_BASE } from "../http/paths.js";
import type { SchmoozeTransport } from "../http/transport.js";

export class TelemetryClient {
  constructor(private readonly transport: SchmoozeTransport) {}

  sendLogs(body: BodyInit, contentType = "application/json"): Promise<Response> {
    return this.transport.requestRaw(
      "POST",
      `${OTEL_BASE}/collector/v1/logs`,
      body,
      { contentType, noClientSignature: true },
    );
  }

  sendMetrics(body: BodyInit, contentType = "application/json"): Promise<Response> {
    return this.transport.requestRaw(
      "POST",
      `${OTEL_BASE}/collector/v1/metrics`,
      body,
      { contentType, noClientSignature: true },
    );
  }

  sendTraces(body: BodyInit, contentType = "application/json"): Promise<Response> {
    return this.transport.requestRaw(
      "POST",
      `${OTEL_BASE}/collector/v1/traces`,
      body,
      { contentType, noClientSignature: true },
    );
  }
}
