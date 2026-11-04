package io.shopverse.order.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderEntity extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String orderNumber;

    @Column(nullable = false, length = 100)
    private String customerUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private OrderStatus status;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, unique = true, length = 64)
    private String correlationId;

    @Column(nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Column(length = 80)
    private String paymentReference;

    @Column(length = 500)
    private String failureReason;

    @Column(name = "shipping_recipient_name", length = 160)
    private String shippingRecipientName;

    @Column(name = "shipping_phone_number", length = 20)
    private String shippingPhoneNumber;

    @Column(name = "shipping_line1", length = 220)
    private String shippingLine1;

    @Column(name = "shipping_line2", length = 220)
    private String shippingLine2;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", length = 100)
    private String shippingState;

    @Column(name = "shipping_postal_code", length = 30)
    private String shippingPostalCode;

    @Column(name = "shipping_country", length = 100)
    private String shippingCountry;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private final List<OrderItemEntity> items = new ArrayList<>();

    public OrderEntity(String orderNumber, String customerUsername, String correlationId, String idempotencyKey) {
        this.orderNumber = orderNumber;
        this.customerUsername = customerUsername;
        this.correlationId = correlationId;
        this.idempotencyKey = idempotencyKey;
        this.status = OrderStatus.ORDER_CREATED;
        this.totalAmount = BigDecimal.ZERO;
    }

    public void addItem(Long productId, String productName, int quantity, BigDecimal unitPrice) {
        items.add(new OrderItemEntity(this, productId, productName, quantity, unitPrice));
        totalAmount = totalAmount.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
    }

    public void setShippingAddress(
            String recipientName,
            String phoneNumber,
            String line1,
            String line2,
            String city,
            String state,
            String postalCode,
            String country
    ) {
        this.shippingRecipientName = recipientName;
        this.shippingPhoneNumber = phoneNumber;
        this.shippingLine1 = line1;
        this.shippingLine2 = line2;
        this.shippingCity = city;
        this.shippingState = state;
        this.shippingPostalCode = postalCode;
        this.shippingCountry = country;
    }

    public void markInventoryRejected(String reason) {
        status = OrderStatus.INVENTORY_REJECTED;
        failureReason = reason;
    }

    public void markInventoryReserved() {
        status = OrderStatus.INVENTORY_RESERVED;
    }

    public void markPaymentProcessing() {
        status = OrderStatus.PAYMENT_PROCESSING;
    }

    public void markPaymentFailed(String reason) {
        status = OrderStatus.PAYMENT_FAILED;
        failureReason = reason;
    }

    public void confirm(String reference) {
        status = OrderStatus.CONFIRMED;
        paymentReference = reference;
        failureReason = null;
    }

    public void cancel() {
        status = OrderStatus.CANCELLED;
    }

    public void markPacking() {
        status = OrderStatus.PACKING;
    }

    public void markShipped() {
        status = OrderStatus.SHIPPED;
    }

    public void markOutForDelivery() {
        status = OrderStatus.OUT_FOR_DELIVERY;
    }

    public void markDelivered() {
        status = OrderStatus.DELIVERED;
    }

    public void requestReturn() {
        status = OrderStatus.RETURN_REQUESTED;
    }

    public void markReturned() {
        status = OrderStatus.RETURNED;
    }
}
