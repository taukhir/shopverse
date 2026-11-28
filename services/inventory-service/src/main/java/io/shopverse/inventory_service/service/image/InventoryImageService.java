package io.shopverse.inventory_service.service.image;

import io.shopverse.inventory_service.dto.InventoryImageResponse;
import org.springframework.web.multipart.MultipartFile;

public interface InventoryImageService {

    InventoryImageResponse upload(Long productId, MultipartFile file);
}
