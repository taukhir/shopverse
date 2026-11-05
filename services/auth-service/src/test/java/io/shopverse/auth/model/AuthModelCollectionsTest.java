package io.shopverse.auth.model;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthModelCollectionsTest {

    @Test
    void authorizationClaimsDoNotShareMutableRoleOrPermissionSets() {
        var permission = new Permission(1L, "orders.read", null, "orders");
        var permissions = new LinkedHashSet<Permission>();
        permissions.add(permission);
        var role = new Role(1L, "ROLE_CUSTOMER", null, permissions);
        var roles = new LinkedHashSet<Role>();
        roles.add(role);
        var user = new User(1L, null, "user", null, null, null, null, null, roles);

        roles.clear();
        permissions.clear();

        assertThat(user.roles()).containsExactly(role);
        assertThat(role.permissions()).containsExactly(permission);
        assertThatThrownBy(() -> user.roles().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> role.permissions().clear()).isInstanceOf(UnsupportedOperationException.class);
    }
}
