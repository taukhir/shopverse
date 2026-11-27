package io.shopverse.discovery;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"eureka.client.register-with-eureka=false",
		"eureka.client.fetch-registry=false",
		"spring.cloud.config.enabled=false",
		"spring.security.user.name=test-eureka-client",
		"spring.security.user.password=test-eureka-password"
})
class DiscoveryServerApplicationTests {

	@Test
	void contextLoads() {
	}

}
