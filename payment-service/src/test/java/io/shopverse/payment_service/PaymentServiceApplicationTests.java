package io.shopverse.payment_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.cloud.config.enabled=false",
		"eureka.client.enabled=false",
		"spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:8081/auth/.well-known/jwks.json"
})
class PaymentServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
