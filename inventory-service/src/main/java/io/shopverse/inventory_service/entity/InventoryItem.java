package io.shopverse.inventory_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Represents an item in the inventory.
 * Maps directly to the 'inventory_items' table in the database.
 *
 * JPA requires a no-arg constructor; PROTECTED prevents accidental public misuse
 * Extends base class for tracking creation/modification times
 */
@Getter
@Entity
@Table(name = "inventory_items")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InventoryItem extends BaseAuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long productId;

    @Column(nullable = false, length = 160)
    private String productName;

    // BigDecimal prevents floating-point rounding errors with currency.
    // precision = total digits; scale = digits after the decimal point (e.g., 99999999999999997.00)
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int availableQuantity;

    @Column(nullable = false)
    private int reservedQuantity;

    // Enables Optimistic Locking to prevent race conditions during concurrent database updates
    @Version
    private long version;

    public InventoryItem(Long productId, String productName, BigDecimal unitPrice, int availableQuantity) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.availableQuantity = availableQuantity;
    }

    /**
     * Helper method to verify if a specific quantity can be reserved.
     * @return true if requested quantity is positive and available stock is sufficient.
     */
    public boolean canReserve(int quantity) {
        return quantity > 0 && availableQuantity >= quantity;
    }

    /**
     * Deducts stock from available and transfers it to reserved.
     * Throws an exception if there isn't enough stock.
     */
    public void reserve(int quantity) {
        if (!canReserve(quantity)) {
            throw new IllegalStateException("Insufficient stock for product " + productId);
        }
        availableQuantity -= quantity;
        reservedQuantity += quantity;
    }

    /**
     * Cancels a reservation, moving items back from 'reserved' to 'available'.
     * Uses Math.min to prevent accidentally releasing more than what is currently reserved.
     */
    public void release(int quantity) {
        int released = Math.min(quantity, reservedQuantity);
        reservedQuantity -= released;
        availableQuantity += released;
    }

    /**
     * Administrative method to reset or override the current product details and stock level.
     */
    public void replaceStock(String name, BigDecimal price, int quantity) {
        productName = name;
        unitPrice = price;
        availableQuantity = quantity;
    }
}
