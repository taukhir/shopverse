package io.shopverse.platform.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ShopverseJwtAuthoritiesConverterTest {

    private final ShopverseJwtAuthoritiesConverter converter = new ShopverseJwtAuthoritiesConverter();

    @Test
    void convertsSpaceSeparatedRolesAndPermissionList() {
        Jwt jwt = jwt(Map.of(
                "roles", "ROLE_CUSTOMER ROLE_ADMIN",
                "permissions", List.of("USER_READ", "USER_UPDATE")
        ));

        assertThat(converter.convert(jwt))
                .extracting(Object::toString)
                .containsExactly("ROLE_CUSTOMER", "ROLE_ADMIN", "USER_READ", "USER_UPDATE");
    }

    @Test
    void convertsRoleListAndIgnoresBlankValues() {
        Jwt jwt = jwt(Map.of(
                "roles", List.of("ROLE_CUSTOMER", " ", "ROLE_ADMIN")
        ));

        assertThat(converter.convert(jwt))
                .extracting(Object::toString)
                .containsExactly("ROLE_CUSTOMER", "ROLE_ADMIN");
    }

    private Jwt jwt(Map<String, Object> claims) {
        return new Jwt(
                "token",
                Instant.now(),
                Instant.now().plusSeconds(60),
                Map.of("alg", "none"),
                claims
        );
    }
}
