package io.shopverse.auth;

import io.shopverse.platform.security.AccessTokenRevocationStore;
import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.service.AuthService;
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
import org.springframework.http.MediaType;
import jakarta.servlet.http.Cookie;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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

	@MockitoBean
	private AuthService authService;

	@BeforeEach
	void setUp() {
		when(revocationStore.isRevoked("logout-test-jti")).thenReturn(false);
	}

	@Test
	void contextLoads() {
	}

	@Test
	void logoutRequiresAnAuthenticatedAccessToken() throws Exception {
		mockMvc.perform(post("/auth/logout")
					.cookie(new Cookie("XSRF-TOKEN", "csrf-test"))
					.header("X-XSRF-TOKEN", "csrf-test"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void csrfEndpointIssuesReadableCsrfCookie() throws Exception {
		mockMvc.perform(get("/auth/csrf"))
				.andExpect(status().isNoContent())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.string("Set-Cookie", org.hamcrest.Matchers.containsString("XSRF-TOKEN=")))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.string("Set-Cookie", org.hamcrest.Matchers.containsString("SameSite=Lax")));
	}

	@Test
	void sessionEndpointIsAnonymousAndNotCached() throws Exception {
		mockMvc.perform(get("/auth/session"))
				.andExpect(status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.authenticated").value(false))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")));
	}

	@Test
	void loginReturnsNoJwtAndSetsAnHttpOnlyAccessCookie() throws Exception {
		when(authService.authenticate(any(LoginRequest.class))).thenReturn(new AuthResponse("synthetic-access-token"));

		mockMvc.perform(post("/auth/login")
					.cookie(new Cookie("XSRF-TOKEN", "csrf-test"))
					.header("X-XSRF-TOKEN", "csrf-test")
					.header("Origin", "http://localhost:4200")
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"username\":\"synthetic-user\",\"password\":\"synthetic-password\"}"))
				.andExpect(status().isOk())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.authenticated").value(true))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.token").doesNotExist())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.string("Set-Cookie", org.hamcrest.Matchers.containsString("SHOPVERSE_ACCESS=synthetic-access-token")))
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.string("Set-Cookie", org.hamcrest.Matchers.containsString("HttpOnly")));
	}

	@Test
	void logoutClearsHttpOnlyAccessAndReadableCsrfCookies() throws Exception {
		Instant issuedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		Instant expiresAt = issuedAt.plusSeconds(600);
		String token = jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
				.id("logout-test-jti")
				.issuer("shopverse-auth-service-test")
				.subject("synthetic-user")
				.issuedAt(issuedAt)
				.expiresAt(expiresAt)
				.build())).getTokenValue();

		mockMvc.perform(post("/auth/logout")
					.header("Authorization", "Bearer " + token)
					.cookie(new Cookie("XSRF-TOKEN", "csrf-test"))
					.header("X-XSRF-TOKEN", "csrf-test")
					.header("Origin", "http://localhost:4200"))
				.andExpect(status().isNoContent())
				.andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
						.stringValues("Set-Cookie", org.hamcrest.Matchers.hasItems(
							org.hamcrest.Matchers.allOf(org.hamcrest.Matchers.containsString("SHOPVERSE_ACCESS="),
								org.hamcrest.Matchers.containsString("HttpOnly"), org.hamcrest.Matchers.containsString("Max-Age=0")),
							org.hamcrest.Matchers.allOf(org.hamcrest.Matchers.containsString("XSRF-TOKEN="),
								org.hamcrest.Matchers.containsString("Max-Age=0")))));
	}

	@Test
	void jwksRemainsPublic() throws Exception {
		mockMvc.perform(get("/auth/.well-known/jwks.json"))
				.andExpect(status().isOk());
	}

	@Test
	void logoutRevokesTheAuthenticatedTokenIdUntilItsExpiry() throws Exception {
		Instant issuedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		Instant expiresAt = issuedAt.plusSeconds(600);
		String token = jwtEncoder.encode(JwtEncoderParameters.from(JwtClaimsSet.builder()
				.id("logout-test-jti")
				.issuer("shopverse-auth-service-test")
				.subject("synthetic-user")
				.issuedAt(issuedAt)
				.expiresAt(expiresAt)
				.build())).getTokenValue();

		mockMvc.perform(post("/auth/logout")
					.header("Authorization", "Bearer " + token)
					.cookie(new Cookie("XSRF-TOKEN", "csrf-test"))
					.header("X-XSRF-TOKEN", "csrf-test")
					.header("Origin", "http://localhost:4200"))
				.andExpect(status().isNoContent());

		verify(revocationStore).revoke(eq("logout-test-jti"), eq(expiresAt));
	}
}
