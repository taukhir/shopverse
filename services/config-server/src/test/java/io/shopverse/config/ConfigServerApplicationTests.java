package io.shopverse.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.security.user.name=test-config-client",
        "spring.security.user.password=test-config-password"
})
class ConfigServerApplicationTests {

	@Test
	void contextLoads() {
	}

}
