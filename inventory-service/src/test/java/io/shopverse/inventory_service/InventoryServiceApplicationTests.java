package io.shopverse.inventory_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.cloud.config.enabled=false",
		"eureka.client.enabled=false",
		"spring.kafka.listener.auto-startup=false",
		"shopverse.kafka.topics.order-created=shopverse.order.created",
		"shopverse.kafka.topics.inventory-reserved=shopverse.inventory.reserved",
		"shopverse.kafka.topics.inventory-failed=shopverse.inventory.failed",
		"shopverse.kafka.topics.payment-completed=shopverse.payment.completed",
		"shopverse.kafka.topics.payment-failed=shopverse.payment.failed",
		"spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8081/auth/.well-known/jwks.json"
})
class InventoryServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
