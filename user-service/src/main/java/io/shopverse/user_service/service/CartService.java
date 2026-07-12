package io.shopverse.user_service.service;

import io.shopverse.user_service.dto.CartResponse;
import io.shopverse.user_service.model.CartRequest;

public interface CartService {

    CartResponse getCart(String username);

    CartResponse replaceCart(String username, CartRequest request);

    CartResponse mergeCart(String username, CartRequest request);

    CartResponse validateCart(String username);

    CartResponse deleteItem(String username, Long productId);
}
