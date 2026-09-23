/**
 * File: src/otel.ts
 * Description: Browser OpenTelemetry tracer for the Valtide UI. Exports OTLP/HTTP
 *   to VITE_OTEL_EXPORTER_OTLP_ENDPOINT (the collector, which fans out to Grafana
 *   LGTM / GCP / AWS). Instruments fetch + document load so a user action traces
 *   end-to-end into the BFF and agent. STRICT NO-OP when the endpoint env var is
 *   unset, so dev, tests, and builds without observability are unaffected.
 * Source: langchain-upgrade.md §6; observability decision O1
 * Author: Sunil+Ai Assistant
 * Date: 2026-09-18
 */
/// <reference types="vite/client" />
import {WebTracerProvider} from '@opentelemetry/sdk-trace-web';
import {BatchSpanProcessor} from '@opentelemetry/sdk-trace-base';
import {OTLPTraceExporter} from '@opentelemetry/exporter-trace-otlp-http';
import {registerInstrumentations} from '@opentelemetry/instrumentation';
import {FetchInstrumentation} from '@opentelemetry/instrumentation-fetch';
import {Resource} from '@opentelemetry/resources';
import {ATTR_SERVICE_NAME} from '@opentelemetry/semantic-conventions';

/**
 * Start browser tracing if an OTLP endpoint is configured at build/runtime.
 * @returns True when tracing started; false when it stayed a no-op.
 */
export function startWebOtel(): boolean {
  const endpoint = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) {
    return false;
  }
  const provider = new WebTracerProvider({
    resource: new Resource({[ATTR_SERVICE_NAME]: 'valtide-ui'}),
  });
  provider.addSpanProcessor(
    new BatchSpanProcessor(new OTLPTraceExporter({url: `${endpoint}/v1/traces`})),
  );
  provider.register();
  registerInstrumentations({instrumentations: [new FetchInstrumentation()]});
  return true;
}
