import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

export function initTracing() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
  const provider = new NodeTracerProvider({
    resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: 'eufm-api' })
  });
  const exporter = new OTLPTraceExporter();
  provider.addSpanProcessor(new BatchSpanProcessor(exporter));
  provider.register();
}


