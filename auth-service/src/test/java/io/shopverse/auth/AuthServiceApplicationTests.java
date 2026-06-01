package io.shopverse.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"rsa.public-key=classpath:keys/public.pem",
		"rsa.private-key=classpath:keys/private.pem",
		"security.jwt.issuer=shopverse-auth-service-test",
		"eureka.client.enabled=false"
})
class AuthServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
