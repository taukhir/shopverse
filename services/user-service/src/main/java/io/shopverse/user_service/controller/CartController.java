package io.shopverse.user_service.controller;

import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.dto.CartResponse;
import io.shopverse.user_service.model.CartRequest;
import io.shopverse.user_service.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiConstants.CART)
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart(Authentication authentication) {
        return cartService.getCart(authentication.getName());
    }

    @PutMapping
    public CartResponse replaceCart(Authentication authentication, @Valid @RequestBody CartRequest request) {
        return cartService.replaceCart(authentication.getName(), request);
    }

    @PostMapping("/merge")
    public CartResponse mergeCart(Authentication authentication, @Valid @RequestBody CartRequest request) {
        return cartService.mergeCart(authentication.getName(), request);
    }

    @PostMapping("/validate")
    public CartResponse validateCart(Authentication authentication) {
        return cartService.validateCart(authentication.getName());
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse deleteItem(Authentication authentication, @PathVariable Long productId) {
        return cartService.deleteItem(authentication.getName(), productId);
    }
}
