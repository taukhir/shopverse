package io.shopverse.order.recovery;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/orders/admin/dead-letters")
public class OrderRecoveryController {
    private final FailedKafkaEventService service;

    @GetMapping
    public List<FailedKafkaEventResponse> getAll() {
        return service.getAll();
    }

    @PostMapping("/{id}/replay")
    public FailedKafkaEventResponse replay(@PathVariable Long id, Authentication authentication) {
        return service.replay(id, authentication.getName());
    }
}
