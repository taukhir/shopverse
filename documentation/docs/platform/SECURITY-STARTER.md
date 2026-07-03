---
title: Security Starter
---

# Security Starter

Back to [Platform Infrastructure](./README.md).

## Status

Implemented for servlet resource-server services.

## Purpose

Use `shopverse-security-starter` to share JWT authority extraction, issuer
validation, JWKS-backed decoding, and Spring Security JWT converter beans.

## Problem

Servlet resource-server services repeated JWT decoder setup, issuer validation,
and role/permission authority mapping.

## When To Use

Use this starter in Spring MVC or servlet-based resource-server services.

Do not use it for token issuing, endpoint authorization policy, Basic auth, or
the reactive `api-gateway`.

## Solution

`shopverse-security-starter` provides:

- `ShopverseJwtAuthoritiesConverter`
- shared `JwtAuthenticationConverter`
- shared `JwtDecoder`
- issuer validation from `security.jwt.issuer`
- JWKS resolution from `spring.security.oauth2.resourceserver.jwt.jwk-set-uri`

## Used By

- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`

## Service-Owned Code

Services still own:

- `SecurityFilterChain`
- endpoint authorization rules
- `@PreAuthorize` policy
- internal Basic auth
- token issuing

`api-gateway` is reactive and not covered by this servlet starter.

## Gradle Dependency

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-security-starter:0.0.1-SNAPSHOT'
}
```

## Configuration Properties

This starter uses standard Spring resource-server configuration plus the local
issuer property.

| Property | Required | Purpose |
|---|---|---|
| `security.jwt.issuer` | yes | Expected token issuer. |
| `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` | yes | JWKS endpoint used by the JWT decoder. |

## Migration Steps

Add the dependency.

```groovy
dependencies {
    implementation 'io.shopverse.platform:shopverse-security-starter:0.0.1-SNAPSHOT'
}
```

Keep issuer and JWKS values in config.

```yaml
security:
  jwt:
    issuer: http://auth-service:8081

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: http://auth-service:8081/.well-known/jwks.json
```

Inject the shared `JwtAuthenticationConverter` into the service-owned security
chain.

```java
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;

@Bean
SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationConverter jwtAuthenticationConverter
) throws Exception {
    return http
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/actuator/health").permitAll()
                    .requestMatchers("/api/orders/**").hasAuthority("SCOPE_orders:read")
                    .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
            )
            .build();
}
```

Delete local JWT authority converter code if it only maps roles or permissions
from token claims into Spring authorities. Keep endpoint rules local because
each service owns its own API authorization policy.

## Verification

Run service security tests:

```powershell
.\gradlew.bat test --no-daemon
```

For runtime verification:

```powershell
docker compose --profile apps up -d auth-service order-service
curl.exe -i http://localhost:8083/actuator/health
```

Then call a protected endpoint with a valid token and verify role/permission
claims map to the expected Spring authorities.

## Troubleshooting

| Symptom | Check |
|---|---|
| `JwtDecoder` bean is missing | The starter dependency is missing or auto-configuration imports are not on the classpath. |
| Tokens fail issuer validation | `security.jwt.issuer` does not match the issuer claim in the token. |
| JWKS lookup fails | `spring.security.oauth2.resourceserver.jwt.jwk-set-uri` is wrong or `auth-service` is not reachable. |
| Authorities are missing | Check token claim names and the platform `ShopverseJwtAuthoritiesConverter` mapping. |
| Gateway mismatch | `api-gateway` is WebFlux; keep reactive security config local. |

## Related Docs

- [Config Property Reference](./CONFIG-PROPERTIES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [JWT JWKS Resource Server](../security/spring-security/JWT-JWKS-RESOURCE-SERVER.md)
