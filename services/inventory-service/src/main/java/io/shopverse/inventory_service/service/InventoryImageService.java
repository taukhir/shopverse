package io.shopverse.inventory_service.service;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.shopverse.inventory_service.config.InventoryImageProperties;
import io.shopverse.inventory_service.dto.InventoryImageResponse;
import io.shopverse.inventory_service.exception.InventoryImageException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryImageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final MinioClient minioClient;
    private final InventoryImageProperties properties;

    public InventoryImageResponse upload(Long productId, MultipartFile file) {
        validate(file);
        String extension = extensionFor(file.getContentType());
        String imageKey = "products/" + productId + "-" + UUID.randomUUID() + extension;
        try {
            ensureBucket();
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(properties.bucket())
                    .object(imageKey)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build());
        } catch (Exception exception) {
            throw new InventoryImageException("Inventory image could not be stored", exception);
        }
        String baseUrl = properties.publicEndpoint().replaceAll("/+$", "");
        return new InventoryImageResponse(baseUrl + "/" + properties.bucket() + "/" + imageKey, imageKey);
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InventoryImageException("Choose a non-empty image file");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new InventoryImageException("Only JPEG, PNG, WebP, and GIF images are supported");
        }
        if (file.getSize() > properties.maxSizeBytes()) {
            throw new InventoryImageException("Image exceeds the configured upload size limit");
        }
    }

    private void ensureBucket() throws Exception {
        if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(properties.bucket()).build())) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
        }
    }

    private String extensionFor(String contentType) {
        return switch (contentType == null ? "" : contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".png";
        };
    }
}
