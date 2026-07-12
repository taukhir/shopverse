package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.dto.CartItemResponse;
import io.shopverse.user_service.dto.CartResponse;
import io.shopverse.user_service.entities.Cart;
import io.shopverse.user_service.entities.CartItem;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.model.CartItemRequest;
import io.shopverse.user_service.model.CartRequest;
import io.shopverse.user_service.repository.CartRepository;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;

    @Override
    public CartResponse getCart(String username) {
        return toResponse(getOrCreate(username), "Cart loaded");
    }

    @Override
    @Transactional
    public CartResponse replaceCart(String username, CartRequest request) {
        Cart cart = getOrCreate(username);
        cart.getItems().clear();
        addItems(cart, request);
        return toResponse(cartRepository.save(cart), "Cart saved");
    }

    @Override
    @Transactional
    public CartResponse mergeCart(String username, CartRequest request) {
        Cart cart = getOrCreate(username);
        Map<Long, CartItem> existing = new LinkedHashMap<>();
        cart.getItems().forEach(item -> existing.put(item.getProductId(), item));
        for (CartItemRequest item : request.items()) {
            CartItem cartItem = existing.get(item.productId());
            if (cartItem == null) {
                cart.getItems().add(CartItem.builder().cart(cart).productId(item.productId()).quantity(item.quantity()).build());
            } else {
                cartItem.setQuantity(cartItem.getQuantity() + item.quantity());
            }
        }
        return toResponse(cartRepository.save(cart), "Cart merged");
    }

    @Override
    public CartResponse validateCart(String username) {
        Cart cart = getOrCreate(username);
        boolean valid = cart.getItems().stream().allMatch(item -> item.getProductId() != null && item.getQuantity() > 0);
        return toResponse(cart, valid ? "Cart is structurally valid" : "Cart contains invalid items", valid);
    }

    @Override
    @Transactional
    public CartResponse deleteItem(String username, Long productId) {
        Cart cart = getOrCreate(username);
        cart.getItems().removeIf(item -> item.getProductId().equals(productId));
        return toResponse(cartRepository.save(cart), "Cart item removed");
    }

    private void addItems(Cart cart, CartRequest request) {
        request.items().forEach(item -> cart.getItems().add(CartItem.builder()
                .cart(cart)
                .productId(item.productId())
                .quantity(item.quantity())
                .build()));
    }

    private Cart getOrCreate(String username) {
        return cartRepository.findByUserUsername(username).orElseGet(() -> {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
            return cartRepository.save(Cart.builder().user(user).build());
        });
    }

    private CartResponse toResponse(Cart cart, String message) {
        return toResponse(cart, message, true);
    }

    private CartResponse toResponse(Cart cart, String message, boolean valid) {
        return new CartResponse(
                cart.getItems().stream()
                        .sorted(Comparator.comparing(CartItem::getProductId))
                        .map(item -> new CartItemResponse(item.getProductId(), item.getQuantity()))
                        .toList(),
                valid,
                message
        );
    }
}
