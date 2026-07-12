package io.shopverse.order.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.shopverse.order.config.KafkaTopicsProperties;
import io.shopverse.order.dto.CatalogItemResponse;
import io.shopverse.order.dto.CheckoutRequest;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.OrderTimelineResponse;
import io.shopverse.order.entity.OrderEntity;
import io.shopverse.order.entity.OrderTimelineEvent;
import io.shopverse.order.entity.OrderTimelineStage;
import io.shopverse.order.entity.OrderStatus;
import io.shopverse.order.exception.IdempotencyKeyConflictException;
import io.shopverse.order.exception.InvalidOrderStateException;
import io.shopverse.order.exception.ResourceNotFoundException;
import io.shopverse.order.outbox.OutboxService;
import io.shopverse.order.repository.OrderRepository;
import io.shopverse.order.repository.OrderTimelineRepository;
import io.shopverse.order.saga.OrderCreatedEvent;
import io.shopverse.order.saga.OrderCancelledEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.EnumSet;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private static final EnumSet<OrderStatus> CUSTOMER_CANCELLABLE_STATUSES = EnumSet.of(
            OrderStatus.ORDER_CREATED,
            OrderStatus.PENDING_INVENTORY,
            OrderStatus.INVENTORY_RESERVED,
            OrderStatus.PAYMENT_PROCESSING,
            OrderStatus.PAYMENT_FAILED
    );

    private final OrderRepository repository;
    private final OrderTimelineRepository timelineRepository;
    private final CatalogService catalogService;
    private final MeterRegistry meterRegistry;
    private final OutboxService outboxService;
    private final KafkaTopicsProperties topics;

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse checkout(
            CheckoutRequest request,
            String username,
            String correlationId,
            String idempotencyKey
    ) {
        var existing = repository.findWithItemsByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            if (!existing.get().getCustomerUsername().equals(username)) {
                throw new IdempotencyKeyConflictException("Idempotency key is already owned by another customer");
            }
            log.atInfo().addKeyValue("idempotencyKey", idempotencyKey)
                    .addKeyValue("orderNumber", existing.get().getOrderNumber())
                    .log("Duplicate checkout returned the existing order");
            return OrderMapper.toResponse(existing.get());
        }
        OrderEntity order = new OrderEntity(
                "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                username,
                correlationId,
                idempotencyKey
        );
        var shippingAddress = request.shippingAddress();
        order.setShippingAddress(
                shippingAddress.recipientName().trim(),
                trimToNull(shippingAddress.phoneNumber()),
                shippingAddress.line1().trim(),
                trimToNull(shippingAddress.line2()),
                shippingAddress.city().trim(),
                shippingAddress.state().trim(),
                shippingAddress.postalCode().trim(),
                shippingAddress.country().trim()
        );
        request.items().forEach(item -> {
            CatalogItemResponse product = catalogService.getProduct(item.productId());
            if (!product.available()) {
                throw new ResourceNotFoundException(
                        "Product is unavailable or does not exist: " + item.productId());
            }
            order.addItem(item.productId(), product.productName(), item.quantity(), product.price());
        });
        OrderEntity saved = repository.save(order);
        appendTimeline(saved, OrderTimelineStage.ORDER_CREATED, "Checkout accepted and order persisted");
        outboxService.enqueue(
                "ORDER",
                saved.getOrderNumber(),
                "OrderCreatedEvent",
                topics.orderCreated(),
                saved.getOrderNumber(),
                new OrderCreatedEvent(
                        saved.getId(),
                        saved.getOrderNumber(),
                        saved.getCorrelationId(),
                        saved.getCustomerUsername(),
                        saved.getItems().getFirst().getProductId(),
                        saved.getItems().getFirst().getQuantity(),
                        saved.getTotalAmount()
                ),
                saved.getCorrelationId()
        );
        log.atInfo()
                .addKeyValue("orderNumber", saved.getOrderNumber())
                .addKeyValue("correlationId", correlationId)
                .log("Order persisted and ready for inventory reservation");
        return OrderMapper.toResponse(saved);
    }

    @Override
    @Cacheable(cacheNames = "orders", key = "#id")
    public OrderResponse getOrder(Long id) {
        return OrderMapper.toResponse(repository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id)));
    }

    @Override
    public List<OrderResponse> getCustomerOrders(String username) {
        return repository.findAllByCustomerUsernameOrderByCreatedAtDesc(username).stream()
                .map(OrderMapper::toResponse)
                .toList();
    }

    @Override
    public List<OrderResponse> getAllOrders() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
                .map(OrderMapper::toResponse)
                .toList();
    }

    @Override
    public List<OrderTimelineResponse> getTimeline(Long orderId) {
        OrderEntity order = repository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        return timelineRepository.findAllByOrderNumberOrderByOccurredAtAsc(order.getOrderNumber()).stream()
                .map(event -> new OrderTimelineResponse(
                        event.getOrderNumber(),
                        event.getCorrelationId(),
                        event.getStage().name(),
                        event.getDetail(),
                        event.getOccurredAt()
                ))
                .toList();
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void cancel(Long id) {
        OrderEntity order = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id))
                ;
        ensureCancellable(order);
        order.cancel();
        appendTimeline(order, OrderTimelineStage.ORDER_CANCELLED, "Order cancelled by administrator");
        enqueueOrderCancelled(order, "Order cancelled by administrator");
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse cancelAdminOrder(Long id) {
        OrderEntity order = repository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        ensureCancellable(order);
        order.cancel();
        appendTimeline(order, OrderTimelineStage.ORDER_CANCELLED, "Order cancelled by administrator");
        enqueueOrderCancelled(order, "Order cancelled by administrator");
        return OrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse pack(Long id) {
        OrderEntity order = findOrderWithItems(id);
        ensureStatus(order, OrderStatus.CONFIRMED, "Only confirmed orders can move to packing");
        order.markPacking();
        appendTimeline(order, OrderTimelineStage.PACKING, "Order moved to packing");
        return OrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse ship(Long id) {
        OrderEntity order = findOrderWithItems(id);
        if (order.getStatus() == OrderStatus.PACKING) {
            order.markShipped();
            appendTimeline(order, OrderTimelineStage.SHIPPED, "Order shipped");
        } else if (order.getStatus() == OrderStatus.SHIPPED) {
            order.markOutForDelivery();
            appendTimeline(order, OrderTimelineStage.OUT_FOR_DELIVERY, "Order out for delivery");
        } else {
            throw new InvalidOrderStateException("Order must be PACKING or SHIPPED before the next shipping transition");
        }
        return OrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse deliver(Long id) {
        OrderEntity order = findOrderWithItems(id);
        if (order.getStatus() != OrderStatus.SHIPPED && order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new InvalidOrderStateException("Only shipped orders can be delivered");
        }
        order.markDelivered();
        appendTimeline(order, OrderTimelineStage.DELIVERED, "Order delivered");
        return OrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse requestReturn(Long id, String username) {
        OrderEntity order = findOrderWithItems(id);
        if (!order.getCustomerUsername().equals(username)) {
            throw new ResourceNotFoundException("Order not found: " + id);
        }
        ensureStatus(order, OrderStatus.DELIVERED, "Only delivered orders can be returned");
        order.requestReturn();
        appendTimeline(order, OrderTimelineStage.RETURN_REQUESTED, "Return requested by customer");
        return OrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public OrderResponse cancelCustomerOrder(Long id, String username) {
        OrderEntity order = repository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
        if (!order.getCustomerUsername().equals(username)) {
            throw new ResourceNotFoundException("Order not found: " + id);
        }
        ensureCancellable(order);
        order.cancel();
        appendTimeline(order, OrderTimelineStage.ORDER_CANCELLED, "Order cancelled by customer");
        enqueueOrderCancelled(order, "Order cancelled by customer");
        return OrderMapper.toResponse(order);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void markInventoryRejected(String orderNumber, String reason) {
        OrderEntity order = findByNumber(orderNumber);
        order.markInventoryRejected(reason);
        appendTimeline(order, OrderTimelineStage.INVENTORY_REJECTED, reason);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void markInventoryReserved(String orderNumber) {
        OrderEntity order = findByNumber(orderNumber);
        order.markInventoryReserved();
        appendTimeline(order, OrderTimelineStage.INVENTORY_RESERVED, "Inventory reservation confirmed");
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void markPaymentProcessing(String orderNumber) {
        OrderEntity order = findByNumber(orderNumber);
        order.markPaymentProcessing();
        appendTimeline(order, OrderTimelineStage.PAYMENT_PROCESSING, "Payment processing started");
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void markInventoryReservedAndPaymentProcessing(String orderNumber) {
        OrderEntity order = findByNumber(orderNumber);
        order.markInventoryReserved();
        appendTimeline(order, OrderTimelineStage.INVENTORY_RESERVED, "Inventory reservation confirmed");
        order.markPaymentProcessing();
        appendTimeline(order, OrderTimelineStage.PAYMENT_PROCESSING, "Payment processing started");
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void markPaymentFailed(String orderNumber, String reason) {
        OrderEntity order = findByNumber(orderNumber);
        order.markPaymentFailed(reason);
        appendTimeline(order, OrderTimelineStage.PAYMENT_FAILED, reason);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = "orders", allEntries = true)
    public void confirm(String orderNumber, String paymentReference) {
        OrderEntity order = findByNumber(orderNumber);
        appendTimeline(order, OrderTimelineStage.PAYMENT_COMPLETED, "Payment reference " + paymentReference);
        order.confirm(paymentReference);
        appendTimeline(order, OrderTimelineStage.ORDER_CONFIRMED, "Order confirmed");
    }

    private OrderEntity findByNumber(String orderNumber) {
        return repository.findWithItemsByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));
    }

    private void appendTimeline(OrderEntity order, OrderTimelineStage stage, String detail) {
        timelineRepository.save(new OrderTimelineEvent(
                order.getOrderNumber(),
                order.getCorrelationId(),
                stage,
                detail
        ));
        meterRegistry.counter(
                "shopverse.saga.transitions",
                "stage", stage.name()
        ).increment();
    }

    private void enqueueOrderCancelled(OrderEntity order, String reason) {
        outboxService.enqueue(
                "ORDER",
                order.getOrderNumber(),
                OrderCancelledEvent.class.getSimpleName(),
                topics.orderCancelled(),
                order.getOrderNumber(),
                new OrderCancelledEvent(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getCorrelationId(),
                        order.getCustomerUsername(),
                        reason
                ),
                order.getCorrelationId()
        );
    }

    private OrderEntity findOrderWithItems(Long id) {
        return repository.findWithItemsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + id));
    }

    private void ensureCancellable(OrderEntity order) {
        if (!CUSTOMER_CANCELLABLE_STATUSES.contains(order.getStatus())) {
            throw new InvalidOrderStateException("Order cannot be cancelled from status: " + order.getStatus());
        }
    }

    private void ensureStatus(OrderEntity order, OrderStatus expected, String message) {
        if (order.getStatus() != expected) {
            throw new InvalidOrderStateException(message + "; current status: " + order.getStatus());
        }
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
