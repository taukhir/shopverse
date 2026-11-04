package io.shopverse.gateway.readiness;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/actuator")
public class ShopverseReadinessController {

    private final ShopverseReadinessService readinessService;

    public ShopverseReadinessController(ShopverseReadinessService readinessService) {
        this.readinessService = readinessService;
    }

    @GetMapping("/shopverse-readiness")
    public Mono<ResponseEntity<ReadinessResponse>> readiness() {
        return readinessService.check()
                .map(response -> ResponseEntity
                        .status("UP".equals(response.status()) ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                        .body(response));
    }
}
