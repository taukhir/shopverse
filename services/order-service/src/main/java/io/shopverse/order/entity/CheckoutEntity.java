package io.shopverse.order.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Entity
@Table(name = "checkouts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CheckoutEntity extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String checkoutNumber;

    @Column(nullable = false, length = 100)
    private String customerUsername;

    @Column(nullable = false)
    private Long version;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal totalAmount;

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

    @Column(nullable = false)
    private Instant expiresAt;

    @Column
    private Long orderId;

    @Column(length = 100)
    private String idempotencyKey;

    @Column
    private Instant placedAt;

    @OneToMany(mappedBy = "checkout", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private final List<CheckoutItemEntity> items = new ArrayList<>();

    public CheckoutEntity(String checkoutNumber, String customerUsername, Instant expiresAt) {
        this.checkoutNumber = checkoutNumber;
        this.customerUsername = customerUsername;
        this.expiresAt = expiresAt;
        this.version = 1L;
        this.currency = "INR";
        this.totalAmount = BigDecimal.ZERO;
    }

    public void addItem(Long productId, String productName, int quantity, BigDecimal unitPrice) {
        items.add(new CheckoutItemEntity(this, productId, productName, quantity, unitPrice));
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

    public void clearItems() {
        items.clear();
        totalAmount = BigDecimal.ZERO;
    }

    public void incrementVersion() {
        version = version + 1;
    }

    public void renewExpiry(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isPlaced() {
        return orderId != null;
    }

    public boolean isExpired(Instant now) {
        return !isPlaced() && now.isAfter(expiresAt);
    }

    public void markPlaced(Long orderId, String idempotencyKey, Instant placedAt) {
        this.orderId = orderId;
        this.idempotencyKey = idempotencyKey;
        this.placedAt = placedAt;
    }
}
