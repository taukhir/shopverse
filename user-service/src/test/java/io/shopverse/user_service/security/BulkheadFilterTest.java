package io.shopverse.user_service.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import io.shopverse.user_service.config.UserServiceProperties;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class BulkheadFilterTest {

    @Test
    void doFilterRejectsWhenConcurrentCapacityIsFull() throws Exception {
        BulkheadFilter filter = new BulkheadFilter(
                new UserServiceProperties(
                        new UserServiceProperties.RateLimit(true, 60, 120),
                        new UserServiceProperties.Bulkhead(true, 1),
                        new UserServiceProperties.Retry(3, 100)
                ),
                bulkhead(1),
                new ObjectMapper().findAndRegisterModules()
        );
        CountDownLatch requestStarted = new CountDownLatch(1);
        CountDownLatch releaseRequest = new CountDownLatch(1);
        AtomicReference<Exception> backgroundError = new AtomicReference<>();

        Thread thread = new Thread(() -> {
            try {
                filter.doFilter(request(), new MockHttpServletResponse(), blockingChain(requestStarted, releaseRequest));
            } catch (Exception ex) {
                backgroundError.set(ex);
            }
        });
        thread.start();
        requestStarted.await();

        MockHttpServletResponse rejected = new MockHttpServletResponse();
        filter.doFilter(request(), rejected, (request, response) -> { });

        releaseRequest.countDown();
        thread.join();

        assertThat(backgroundError.get()).isNull();
        assertThat(rejected.getStatus()).isEqualTo(503);
    }

    private FilterChain blockingChain(CountDownLatch started, CountDownLatch release) {
        return (request, response) -> {
            started.countDown();
            try {
                release.await();
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
        };
    }

    private MockHttpServletRequest request() {
        return new MockHttpServletRequest("GET", "/api/v1/users");
    }

    private Bulkhead bulkhead(int maxConcurrentCalls) {
        return Bulkhead.of("test-bulkhead", BulkheadConfig.custom()
                .maxConcurrentCalls(maxConcurrentCalls)
                .maxWaitDuration(Duration.ZERO)
                .build());
    }
}
