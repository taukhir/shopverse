package io.shopverse.auth.dto;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class BrowserSessionResponseTest {

    @Test
    void rolesAreDefensivelyCopiedAndImmutable() {
        var sourceRoles = new ArrayList<>(List.of("ROLE_CUSTOMER"));
        var response = new BrowserSessionResponse(true, "customer", sourceRoles, Instant.now());

        sourceRoles.add("ROLE_ADMIN");

        assertThat(response.roles()).containsExactly("ROLE_CUSTOMER");
        assertThatThrownBy(() -> response.roles().add("ROLE_ADMIN"))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
