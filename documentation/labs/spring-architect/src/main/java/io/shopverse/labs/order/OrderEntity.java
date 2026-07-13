package io.shopverse.labs.order;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "shop_orders")
public class OrderEntity {
    @Id
    private UUID id;
    private String customerId;
    private String status;
    private BigDecimal total;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.LAZY)
    private final List<OrderLineEntity> lines = new ArrayList<>();

    protected OrderEntity() {
    }

    public OrderEntity(UUID id, String customerId) {
        this.id = id;
        this.customerId = customerId;
        this.status = "PENDING";
        this.total = BigDecimal.ZERO;
    }

    public void addLine(String sku, int quantity, BigDecimal unitPrice) {
        lines.add(new OrderLineEntity(UUID.randomUUID(), this, sku, quantity, unitPrice));
        total = total.add(unitPrice.multiply(BigDecimal.valueOf(quantity)));
    }

    public UUID getId() { return id; }
    public String getCustomerId() { return customerId; }
    public String getStatus() { return status; }
    public BigDecimal getTotal() { return total; }
    public List<OrderLineEntity> getLines() { return lines; }
}
