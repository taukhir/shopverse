package io.shopverse.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
		"eureka.client.register-with-eureka=false",
		"eureka.client.fetch-registry=false"
})
class ApiGatewayApplicationTests {

	@MockitoBean
	private ReactiveJwtDecoder jwtDecoder;

	@Test
	void contextLoads() {
	}

}
