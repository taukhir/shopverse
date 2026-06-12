package io.shopverse.order;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
		"eureka.client.enabled=false",
		"spring.cloud.config.enabled=false",
		"management.tracing.enabled=false",
		"spring.datasource.url=jdbc:h2:mem:orders;MODE=MySQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=none",
		"spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yml",
		"spring.kafka.listener.auto-startup=false",
		"shopverse.kafka.topics.order-created=shopverse.order.created",
		"shopverse.kafka.topics.inventory-reserved=shopverse.inventory.reserved",
		"shopverse.kafka.topics.inventory-failed=shopverse.inventory.failed",
		"shopverse.kafka.topics.payment-completed=shopverse.payment.completed",
		"shopverse.kafka.topics.payment-failed=shopverse.payment.failed",
		"security.jwt.issuer=shopverse-auth-service"
})
class OrderServiceApplicationTests {

	@MockitoBean
	private JwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
