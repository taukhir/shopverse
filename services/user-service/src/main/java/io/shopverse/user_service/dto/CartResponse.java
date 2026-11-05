package io.shopverse.user_service.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record CartResponse(List<CartItemResponse> items, boolean valid, String message) {
    public CartResponse {
        items = items == null ? null : Collections.unmodifiableList(new ArrayList<>(items));
    }

}
