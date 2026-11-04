package io.shopverse.user_service.dto;

import java.util.List;

public record CartResponse(List<CartItemResponse> items, boolean valid, String message) {
}
