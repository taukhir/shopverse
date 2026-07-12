package io.shopverse.inventory_service.repository;

import io.shopverse.inventory_service.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    Optional<InventoryItem> findByProductId(Long productId);

    List<InventoryItem> findTop8ByCategoryAndProductIdNotOrderByAvailableQuantityDesc(String category, Long productId);
}
