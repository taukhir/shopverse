package io.shopverse.labs.order;

import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class OrderSearchOperationsImpl implements OrderSearchOperations {
    private final EntityManager entityManager;

    public OrderSearchOperationsImpl(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    public List<OrderEntity> findOrdersAtOrAbove(BigDecimal minimumTotal, int limit) {
        if (limit < 1 || limit > 100) {
            throw new IllegalArgumentException("limit must be between 1 and 100");
        }
        return entityManager.createQuery("""
                        select o from OrderEntity o
                        where o.total >= :minimumTotal
                        order by o.total desc, o.id
                        """, OrderEntity.class)
                .setParameter("minimumTotal", minimumTotal)
                .setMaxResults(limit)
                .getResultList();
    }
}
