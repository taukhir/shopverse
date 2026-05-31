package io.shopverse.security.controller;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import io.shopverse.security.dto.AuthResponse;
import io.shopverse.security.dto.LoginRequest;
import io.shopverse.security.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
    private final RSAKey rsaKey;

    @GetMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req){
        log.info("Login requested for username={}", req.username());
        return  ResponseEntity
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

    @GetMapping("verify")
    public String verify(){
        log.info("Auth token verification endpoint requested");
        return "verified";
    }

}
