package io.shopverse.order;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
		"eureka.client.enabled=false",
		"management.tracing.enabled=false",
		"spring.kafka.listener.auto-startup=false",
		"shopverse.kafka.topics.order-created=shopverse.order.created",
		"shopverse.kafka.topics.inventory-reserved=shopverse.inventory.reserved",
		"shopverse.kafka.topics.inventory-failed=shopverse.inventory.failed",
		"shopverse.kafka.topics.payment-completed=shopverse.payment.completed",
		"shopverse.kafka.topics.payment-failed=shopverse.payment.failed"
})
class OrderServiceApplicationTests {

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
