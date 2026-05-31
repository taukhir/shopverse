package io.shopverse.security.service;

import io.shopverse.security.dto.AuthResponse;
import io.shopverse.security.model.Role;
import io.shopverse.security.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RefreshScope
@RequiredArgsConstructor
public class JwtService {

    private final UserServiceClient userService;
    private final JwtEncoder jwtEncoder;

    @Value("${security.jwt.issuer}")
    private String issuer;

    public AuthResponse generateToken(User req) {
        User user = userService.loadByUsername(req.username());

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .id(UUID.randomUUID().toString())
                .issuer(issuer)
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plus(1, ChronoUnit.HOURS))
                .subject(user.username())
                .claim(
                        "roles",
                        user.roles()
                                .stream()
                                .map(Role::roleName)
                                .collect(Collectors.joining(" "))
                )
                .build();

        return new AuthResponse(jwtEncoder.encode(
                JwtEncoderParameters.from(claims)
        ).getTokenValue());
    }
}
