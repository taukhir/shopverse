package io.shopverse.labs.security;

import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class OrderSecurityController {
    @GetMapping("/api/orders/{orderId}")
    @PreAuthorize("#customerId == authentication.name or hasAuthority('SCOPE_orders.admin')")
    public Map<String, String> order(
            @PathVariable String orderId,
            String customerId) {
        return Map.of("orderId", orderId, "customerId", customerId);
    }
}
