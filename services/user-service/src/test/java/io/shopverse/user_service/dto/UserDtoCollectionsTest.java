package io.shopverse.user_service.dto;

import io.shopverse.user_service.model.CreateRoleRequest;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.LinkedHashSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserDtoCollectionsTest {

    @Test
    void permissionRequestsTakeImmutableSnapshots() {
        var permissions = new LinkedHashSet<String>();
        permissions.add("orders.read");
        var request = new CreateRoleRequest("ROLE_CUSTOMER", null, permissions);

        permissions.clear();

        assertThat(request.permissions()).containsExactly("orders.read");
        assertThatThrownBy(() -> request.permissions().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void cartResponseCopiesTheListAndRetainsNullElementsForCompatibility() {
        var items = new ArrayList<CartItemResponse>();
        items.add(null);
        var response = new CartResponse(items, false, null);

        items.clear();

        assertThat(response.items()).containsExactly((CartItemResponse) null);
        assertThatThrownBy(() -> response.items().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void absentCollectionsKeepTheirExistingNullSemantics() {
        assertThat(new CartResponse(null, false, null).items()).isNull();
        assertThat(new CreateRoleRequest("role", null, null).permissions()).isNull();
    }
}
