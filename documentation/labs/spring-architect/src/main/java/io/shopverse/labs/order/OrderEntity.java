package io.shopverse.labs.order;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "shop_orders")
@EntityListeners(AuditingEntityListener.class)
public class OrderEntity {
    @Id
    private UUID id;
    private String customerId;
    private String status;
    private BigDecimal total;
    @Version
    private long version;
    @CreatedDate
    private Instant createdAt;
    @CreatedBy
    private String createdBy;

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

    public void transitionTo(String nextStatus) {
        this.status = nextStatus;
    }

    public UUID getId() { return id; }
    public String getCustomerId() { return customerId; }
    public String getStatus() { return status; }
    public BigDecimal getTotal() { return total; }
    public long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }
    public List<OrderLineEntity> getLines() { return lines; }
}
