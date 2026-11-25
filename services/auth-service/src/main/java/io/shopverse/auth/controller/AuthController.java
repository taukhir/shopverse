package io.shopverse.auth.controller;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.service.AccessTokenRevocationService;
import io.shopverse.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final AccessTokenRevocationService accessTokenRevocationService;
    private final RSAKey rsaKey;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        log.info("Login requested for username={}", req.username());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(authService.authenticate(req));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal Jwt jwt) {
        accessTokenRevocationService.revoke(jwt);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> keys() {
        log.info("JWKS public keys requested");

        JWKSet jwkSet =
                new JWKSet(rsaKey.toPublicJWK());

        return jwkSet.toJSONObject();
    }
}
