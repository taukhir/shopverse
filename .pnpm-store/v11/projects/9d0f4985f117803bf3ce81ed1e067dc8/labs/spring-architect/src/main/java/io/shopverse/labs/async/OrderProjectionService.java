package io.shopverse.labs.async;

import java.util.concurrent.CompletableFuture;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class OrderProjectionService {
    @Async("orderExecutor")
    public CompletableFuture<String> rebuild(String orderId) {
        return CompletableFuture.completedFuture(
                orderId + "@" + Thread.currentThread().getName());
    }
}
