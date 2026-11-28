package io.shopverse.inventory_service.service.catalog;

import io.shopverse.inventory_service.dto.InventoryResponse;
import io.shopverse.inventory_service.dto.InventoryUpsertRequest;
import io.shopverse.inventory_service.entity.InventoryItem;
import io.shopverse.inventory_service.exception.ResourceNotFoundException;
import io.shopverse.inventory_service.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryCatalogServiceImpl implements InventoryCatalogService {

    private final InventoryItemRepository itemRepository;

    @Override
    @Transactional
    @CacheEvict(cacheNames = "inventory", allEntries = true)
    public InventoryResponse upsert(InventoryUpsertRequest request) {
        InventoryItem item = itemRepository.findByProductId(request.productId())
                .map(existing -> {
                    existing.replaceCatalogDetails(
                            request.productName(),
                            request.brand(),
                            request.model(),
                            request.category(),
                            request.description(),
                            request.imageUrl(),
                            request.imageKey(),
                            request.unitPrice(),
                            request.availableQuantity()
                    );
                    return existing;
                })
                .orElseGet(() -> new InventoryItem(
                        request.productId(),
                        request.productName(),
                        request.brand(),
                        request.model(),
                        request.category(),
                        request.description(),
                        request.imageUrl(),
                        request.imageKey(),
                        request.unitPrice(),
                        request.availableQuantity()
                ));
        return toResponse(itemRepository.save(item));
    }

    @Override
    @Cacheable(cacheNames = "inventory", key = "#productId")
    public InventoryResponse getByProductId(Long productId) {
        return toResponse(findItem(productId));
    }

    @Override
    public List<InventoryResponse> getAll() {
        return itemRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<String> getCategories() {
        return itemRepository.findAll().stream()
                .map(InventoryItem::getCategory)
                .filter(category -> category != null && !category.isBlank())
                .distinct()
                .sorted()
                .toList();
    }

    @Override
    public List<InventoryResponse> getRelated(Long productId) {
        InventoryItem item = findItem(productId);
        List<InventoryItem> related = item.getCategory() == null || item.getCategory().isBlank()
                ? itemRepository.findAll().stream()
                        .filter(candidate -> !candidate.getProductId().equals(productId))
                        .sorted(Comparator.comparing(InventoryItem::getAvailableQuantity).reversed())
                        .limit(8)
                        .toList()
                : itemRepository.findTop8ByCategoryAndProductIdNotOrderByAvailableQuantityDesc(
                        item.getCategory(), productId);
        return related.stream().map(this::toResponse).toList();
    }

    private InventoryItem findItem(Long productId) {
        return itemRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + productId));
    }

    private InventoryResponse toResponse(InventoryItem item) {
        return new InventoryResponse(
                item.getId(),
                item.getProductId(),
                item.getProductName(),
                item.getBrand(),
                item.getModel(),
                item.getCategory(),
                item.getDescription(),
                item.getImageUrl(),
                item.getImageKey(),
                item.getUnitPrice(),
                item.getAvailableQuantity(),
                item.getReservedQuantity(),
                item.getAvailableQuantity() > 0,
                item.getUpdatedAt()
        );
    }
}
