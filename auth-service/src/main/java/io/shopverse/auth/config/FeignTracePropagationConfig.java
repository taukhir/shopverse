package io.shopverse.auth.config;

import feign.RequestInterceptor;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignTracePropagationConfig {

    private static final String TRACE_ID = "traceId";
    private static final String SPAN_ID = "spanId";
    private static final String TRACEPARENT = "traceparent";
    private static final String B3_TRACE_ID = "X-B3-TraceId";
    private static final String B3_SPAN_ID = "X-B3-SpanId";
    private static final String B3_SAMPLED = "X-B3-Sampled";
    private static final String TRACEPARENT_VERSION = "00";
    private static final String TRACEPARENT_SAMPLED = "01";
    private static final String HEADER_SEPARATOR = "-";

    @Bean
    public RequestInterceptor tracePropagationRequestInterceptor() {
        return template -> {
            String traceId = MDC.get(TRACE_ID);
            String spanId = MDC.get(SPAN_ID);

            if (!isValidTraceContext(traceId, spanId)) {
                return;
            }

            template.header(TRACEPARENT, String.join(
                    HEADER_SEPARATOR,
                    TRACEPARENT_VERSION,
                    traceId,
                    spanId,
                    TRACEPARENT_SAMPLED
            ));
            template.header(B3_TRACE_ID, traceId);
            template.header(B3_SPAN_ID, spanId);
            template.header(B3_SAMPLED, "1");
        };
    }

    private boolean isValidTraceContext(String traceId, String spanId) {
        return traceId != null && !traceId.isBlank()
                && spanId != null && !spanId.isBlank();
    }
}
