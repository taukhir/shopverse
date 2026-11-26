package io.shopverse.auth.controller;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import io.shopverse.auth.dto.BrowserSessionResponse;
import io.shopverse.auth.dto.LoginResponse;
import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.service.AccessTokenRevocationService;
import io.shopverse.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final AccessTokenRevocationService accessTokenRevocationService;
    private final RSAKey rsaKey;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${security.browser.access-cookie-name:SHOPVERSE_ACCESS}")
    private String accessCookieName;

    @Value("${security.browser.csrf-cookie-name:XSRF-TOKEN}")
    private String csrfCookieName;

    @Value("${security.browser.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${security.jwt.access-token-ttl:PT1H}")
    private Duration accessTokenTtl;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse issued = authService.authenticate(req);
        return ResponseEntity.status(HttpStatus.OK)
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, accessCookie(issued.token(), accessTokenTtl).toString())
                .body(new LoginResponse(true));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        accessTokenRevocationService.revoke(jwt);
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, accessCookie("", Duration.ZERO).toString())
                .header(HttpHeaders.SET_COOKIE, csrfCookie("", Duration.ZERO).toString())
                .build();
    }

    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf() {
        byte[] random = new byte[32];
        secureRandom.nextBytes(random);
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, csrfCookie(Base64.getUrlEncoder().withoutPadding().encodeToString(random), accessTokenTtl).toString())
                .build();
    }

    @GetMapping("/session")
    public ResponseEntity<BrowserSessionResponse> session(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new BrowserSessionResponse(false, null, List.of(), null));
        }
        String roleClaim = jwt.getClaimAsString("roles");
        List<String> roles = roleClaim == null || roleClaim.isBlank()
                ? List.of()
                : Arrays.stream(roleClaim.split("\\s+")).filter(role -> !role.isBlank()).toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new BrowserSessionResponse(true, jwt.getSubject(), roles, jwt.getExpiresAt()));
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> keys() {
        log.info("JWKS public keys requested");

        JWKSet jwkSet =
                new JWKSet(rsaKey.toPublicJWK());

        return jwkSet.toJSONObject();
    }

    private ResponseCookie accessCookie(String token, Duration maxAge) {
        return ResponseCookie.from(accessCookieName, token)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie csrfCookie(String token, Duration maxAge) {
        return ResponseCookie.from(csrfCookieName, token)
                .httpOnly(false)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}
