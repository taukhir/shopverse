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

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int availableQuantity;

    @Column(nullable = false)
    private int reservedQuantity;

    @Version
    private long version;

    public InventoryItem(Long productId, String productName, BigDecimal unitPrice, int availableQuantity) {
        this.productId = productId;
        this.productName = productName;
        this.unitPrice = unitPrice;
        this.availableQuantity = availableQuantity;
    }

    public boolean canReserve(int quantity) {
        return quantity > 0 && availableQuantity >= quantity;
    }

    public void reserve(int quantity) {
        if (!canReserve(quantity)) {
            throw new IllegalStateException("Insufficient stock for product " + productId);
        }
        availableQuantity -= quantity;
        reservedQuantity += quantity;
    }

    public void release(int quantity) {
        int released = Math.min(quantity, reservedQuantity);
        reservedQuantity -= released;
        availableQuantity += released;
    }

    public void replaceStock(String name, BigDecimal price, int quantity) {
        productName = name;
        unitPrice = price;
        availableQuantity = quantity;
    }
}
