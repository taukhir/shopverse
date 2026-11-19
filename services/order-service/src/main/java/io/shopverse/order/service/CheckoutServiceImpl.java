package io.shopverse.order.service;

import io.shopverse.order.dto.CheckoutItemRequest;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.CheckoutResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.PlaceOrderRequest;
import io.shopverse.order.dto.ShippingAddressRequest;
import io.shopverse.order.entity.CheckoutEntity;
import io.shopverse.order.exception.CheckoutAlreadyPlacedException;
import io.shopverse.order.exception.CheckoutExpiredException;
import io.shopverse.order.exception.CheckoutVersionMismatchException;
import io.shopverse.order.exception.ResourceNotFoundException;
import io.shopverse.order.repository.CheckoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CheckoutServiceImpl implements CheckoutService {

    private static final Duration CHECKOUT_TTL = Duration.ofMinutes(15);

    private final CheckoutRepository repository;
    private final CheckoutItemValidator itemValidator;
    private final OrderService orderService;

    @Override
    @Transactional
    public CheckoutResponse createCheckout(CheckoutRequest request, String username) {
        Instant now = Instant.now();
        CheckoutEntity checkout = new CheckoutEntity(
                "CHK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                username,
                now.plus(CHECKOUT_TTL)
        );
        var shippingAddress = request.shippingAddress();
        checkout.setShippingAddress(
                shippingAddress.recipientName().trim(),
                trimToNull(shippingAddress.phoneNumber()),
                shippingAddress.line1().trim(),
                trimToNull(shippingAddress.line2()),
                shippingAddress.city().trim(),
                shippingAddress.state().trim(),
                shippingAddress.postalCode().trim(),
                shippingAddress.country().trim()
        );
        itemValidator.validateItems(request).forEach(item ->
                checkout.addItem(item.productId(), item.productName(), item.quantity(), item.unitPrice()));
        CheckoutEntity saved = repository.save(checkout);
        log.atInfo().addKeyValue("checkoutNumber", saved.getCheckoutNumber()).log("Checkout created");
        return CheckoutMapper.toResponse(saved, now);
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(
            String checkoutNumber,
            PlaceOrderRequest request,
            String username,
            String correlationId,
            String idempotencyKey
    ) {
        CheckoutEntity checkout = repository.findWithItemsByCheckoutNumberAndCustomerUsername(checkoutNumber, username)
                .orElseThrow(() -> new ResourceNotFoundException("Checkout not found: " + checkoutNumber));

        if (checkout.isPlaced()) {
            if (checkout.getIdempotencyKey().equals(idempotencyKey)) {
                log.atInfo().addKeyValue("checkoutNumber", checkoutNumber)
                        .log("Duplicate place-order returned the existing order");
                return orderService.getOrder(checkout.getOrderId());
            }
            throw new CheckoutAlreadyPlacedException(
                    "This checkout has already been placed. Retrieve it to view its order.");
        }
        if (!request.checkoutVersion().equals(checkout.getVersion())) {
            throw new CheckoutVersionMismatchException(
                    "The checkout has changed. Review the latest version before placing the order.");
        }
        Instant now = Instant.now();
        if (checkout.isExpired(now)) {
            throw new CheckoutExpiredException(
                    "The checkout price has expired. Request a new quote before placing the order.");
        }

        OrderResponse order = orderService.checkout(toOrderRequest(checkout), username, correlationId, idempotencyKey);
        checkout.markPlaced(order.id(), idempotencyKey, now);
        return order;
    }

    private CheckoutRequest toOrderRequest(CheckoutEntity checkout) {
        List<CheckoutItemRequest> items = checkout.getItems().stream()
                .map(item -> new CheckoutItemRequest(item.getProductId(), item.getQuantity()))
                .toList();
        ShippingAddressRequest address = new ShippingAddressRequest(
                checkout.getShippingRecipientName(),
                checkout.getShippingPhoneNumber(),
                checkout.getShippingLine1(),
                checkout.getShippingLine2(),
                checkout.getShippingCity(),
                checkout.getShippingState(),
                checkout.getShippingPostalCode(),
                checkout.getShippingCountry()
        );
        return new CheckoutRequest(items, address);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
