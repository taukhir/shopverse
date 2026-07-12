package io.shopverse.order.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("shopverse.kafka.topics")
public record KafkaTopicsProperties(
        @NotBlank String orderCreated,
        @NotBlank String inventoryReserved,
        @NotBlank String inventoryFailed,
        @NotBlank String paymentCompleted,
        @NotBlank String paymentFailed,
        @NotBlank String orderCancelled
) {
}
