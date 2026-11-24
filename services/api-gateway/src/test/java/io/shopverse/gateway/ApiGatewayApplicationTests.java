package io.shopverse.gateway;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
		"eureka.client.register-with-eureka=false",
		"eureka.client.fetch-registry=false",
		"spring.cloud.config.enabled=false",
		"security.jwt.issuer=shopverse-auth-service"
})
@Import(ApiGatewayApplicationTests.SecurityProbeController.class)
class ApiGatewayApplicationTests {

	@LocalServerPort
	private int port;

	private WebTestClient webTestClient;

	@MockitoBean
	private ReactiveJwtDecoder jwtDecoder;

	@BeforeEach
	void setUp() {
		webTestClient = WebTestClient.bindToServer()
				.baseUrl("http://localhost:" + port)
				.build();
	}

	@Test
	void contextLoads() {
	}

	@Test
	void publicUserRegistrationAndHealthAreAnonymousWhileUserAndInternalRoutesRemainProtected() {
		webTestClient.post()
				.uri("/api/v1/public/users/register")
				.exchange()
				.expectStatus().isCreated();
		webTestClient.get()
				.uri("/api/v1/public/health")
				.exchange()
				.expectStatus().isOk();
		webTestClient.get()
				.uri("/api/v1/users/me")
				.exchange()
				.expectStatus().isUnauthorized();
		webTestClient.get()
				.uri("/api/v1/accounts/current")
				.exchange()
				.expectStatus().isUnauthorized();
		webTestClient.get()
				.uri("/api/v1/public/unlisted")
				.exchange()
				.expectStatus().isOk();
		webTestClient.get()
				.uri("/api/v1/internal/users/authenticated")
				.exchange()
				.expectStatus().isUnauthorized();
	}

	@RestController
	static class SecurityProbeController {
		@GetMapping("/api/v1/public/health")
		String health() {
			return "ok";
		}

		@PostMapping("/api/v1/public/users/register")
		ResponseEntity<String> register() {
			return ResponseEntity.status(HttpStatus.CREATED).body("created");
		}

		@GetMapping({"/api/v1/users/me", "/api/v1/accounts/current", "/api/v1/internal/users/authenticated", "/api/v1/public/unlisted"})
		String protectedEndpoint() {
			return "protected";
		}
	}

}
