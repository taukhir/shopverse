package io.shopverse.auth.controller;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import io.shopverse.auth.dto.AuthResponse;
import io.shopverse.auth.dto.LoginRequest;
import io.shopverse.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final RSAKey rsaKey;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        log.info("Login requested for username={}", req.username());
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(authService.authenticate(req));
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> keys() {
        log.info("JWKS public keys requested");

        JWKSet jwkSet =
                new JWKSet(rsaKey.toPublicJWK());

        return jwkSet.toJSONObject();
    }
}
