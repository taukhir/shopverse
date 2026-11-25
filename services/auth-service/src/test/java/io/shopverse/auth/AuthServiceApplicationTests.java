package io.shopverse.auth;

import io.shopverse.platform.security.AccessTokenRevocationStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
		"rsa.public-key=classpath:keys/public.pem",
		"rsa.private-key=classpath:keys/private.pem",
		"security.jwt.issuer=shopverse-auth-service-test",
		"eureka.client.enabled=false"
})
@AutoConfigureMockMvc
class AuthServiceApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private JwtEncoder jwtEncoder;

	@MockitoBean
	private AccessTokenRevocationStore revocationStore;

	@BeforeEach
	void setUp() {
		when(revocationStore.isRevoked("logout-test-jti")).thenReturn(false);
	}

	@Test
	void contextLoads() {
	}

	@Test
	void logoutRequiresAnAuthenticatedAccessToken() throws Exception {
		mockMvc.perform(post("/auth/logout"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void jwksRemainsPublic() throws Exception {
		mockMvc.perform(get("/auth/.well-known/jwks.json"))
				.andExpect(status().isOk());
	}

	@Test
	void logoutRevokesTheAuthenticatedTokenIdUntilItsExpiry() throws Exception {
		Instant issuedAt = Instant.now();
		Instant expiresAt = issuedAt.plusSeconds(600);
		String token = jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
				.id("logout-test-jti")
				.issuer("shopverse-auth-service-test")
				.subject("synthetic-user")
				.issuedAt(issuedAt)
				.expiresAt(expiresAt)
				.build())).getTokenValue();

		mockMvc.perform(post("/auth/logout")
					.header("Authorization", "Bearer " + token))
				.andExpect(status().isNoContent());

		verify(revocationStore).revoke("logout-test-jti", expiresAt);
	}
}
