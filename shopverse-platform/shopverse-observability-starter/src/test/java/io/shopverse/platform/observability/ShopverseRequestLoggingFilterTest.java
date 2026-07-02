package io.shopverse.platform.observability;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class ShopverseRequestLoggingFilterTest {

    private final SimpleMeterRegistry meterRegistry = new SimpleMeterRegistry();
    private final ShopverseRequestLoggingFilter filter = new ShopverseRequestLoggingFilter(
            meterRegistry,
            "USER-SERVICE",
            "shopverse.service.requests.logged",
            "/actuator/"
    );

    @Test
    void propagatesSuppliedCorrelationIdAndRecordsMetric() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users");
        request.addHeader(CorrelationConstants.HEADER_NAME, "test-correlation-id");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(CorrelationConstants.HEADER_NAME)).isEqualTo("test-correlation-id");
        assertThat(meterRegistry.counter(
                "shopverse.service.requests.logged",
                "service", "USER-SERVICE",
                "method", "GET",
                "status", "200",
                "outcome", "SUCCESS"
        ).count()).isEqualTo(1.0);
    }

    @Test
    void createsCorrelationIdWhenRequestDoesNotProvideOne() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(CorrelationConstants.HEADER_NAME)).isNotBlank();
    }

    @Test
    void skipsActuatorRequests() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/actuator/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(CorrelationConstants.HEADER_NAME)).isNull();
        assertThat(meterRegistry.find("shopverse.service.requests.logged").counter()).isNull();
    }
}
