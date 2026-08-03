package io.shopverse.labs.order;

import java.math.BigDecimal;
import java.util.List;

public interface OrderSearchOperations {
    List<OrderEntity> findOrdersAtOrAbove(BigDecimal minimumTotal, int limit);
}
