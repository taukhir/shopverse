package io.shopverse.auth.config;

import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;


// This class is responsible for configuring JWT encoding and decoding.
// JWT encoding = creating/signing JWT tokens.
// JWT decoding = reading/verifying JWT tokens.
@Configuration
public class JwtConfig {

    // Custom properties class that holds RSA public and private keys.
    // Usually these keys are loaded from application.yml, .pem files, or environment variables.
    private final RSAKeyProperties rsaKeys;

    // Constructor injection is used to inject RSAKeyProperties.
    public JwtConfig(RSAKeyProperties rsaKeys) {
        this.rsaKeys = rsaKeys;
    }

    // This bean is used to generate/sign JWT tokens.
    // Spring Security will use this JwtEncoder whenever we create JWT access tokens.
    @Bean
    JwtEncoder jwtEncoder() {

        // JWK means JSON Web Key.
        // Here we are converting our RSA public/private key pair into JWK format.
        // Public key is included so others can identify/verify the key.
        // Private key is included because token signing requires the private key.
        JWK jwk = new RSAKey.Builder(rsaKeys.publicKey())
                .privateKey(rsaKeys.privateKey()) // Used to sign JWT tokens
                .keyID("key-1")                  // Unique ID for this key
                .build();

        // JWKSource is a source/provider of signing keys.
        // NimbusJwtEncoder expects keys in this format.
        JWKSource<SecurityContext> jwks =
                new ImmutableJWKSet<>(new JWKSet(jwk));

        // NimbusJwtEncoder uses the JWK source to sign JWT tokens.
        // Internally, it uses the private key from the JWK.
        return new NimbusJwtEncoder(jwks);
    }

    // This bean is used to decode and verify JWT tokens.
    // Resource servers use JwtDecoder to validate incoming access tokens.
    @Bean
    JwtDecoder jwtDecoder() {

        // We only need the public key to verify JWT signatures.
        // The private key is NOT required for token validation.
        return NimbusJwtDecoder
                .withPublicKey(rsaKeys.publicKey())
                .build();
    }

    // This bean exposes the RSA key as a reusable JWK object.
    // This can be useful if you want to publish your public key through a JWK Set endpoint.
    @Bean
    public RSAKey rsaKey() {

        // Creates an RSA JWK containing both public and private key.
        // Be careful: never expose the private key publicly.
        return new RSAKey.Builder(rsaKeys.publicKey())
                .privateKey(rsaKeys.privateKey())
                .keyID("key-1")
                .build();
    }
}
