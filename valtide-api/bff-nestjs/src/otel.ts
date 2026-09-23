/**
 * File: src/otel.ts
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-18
 * Description:
 *   OpenTelemetry bootstrap for the NestJS BFF. Started BEFORE the Nest app
 *   so HTTP + outbound axios calls are auto-instrumented. Exports OTLP/HTTP
 *   to OTEL_EXPORTER_OTLP_ENDPOINT (Grafana LGTM locally; GCP/AWS via the
 *   collector's exporter config). STRICT NO-OP when the endpoint is unset,
 *   so local dev and tests are unaffected. Vendor-neutral by design (the app
 *   only ever speaks OTLP).
 * Source: langchain-upgrade.md §6; observability decision O1
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

let sdk: NodeSDK | undefined;

/**
 * Start OpenTelemetry tracing if an OTLP endpoint is configured.
 * @returns True when tracing started; false when it stayed a no-op.
 */
export function startOtel(): boolean {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return false;
  }
  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'valtide-bff',
    }),
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
  // eslint-disable-next-line no-console
  console.log(
    `[otel] BFF tracing enabled -> ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`,
  );
  return true;
}
