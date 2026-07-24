package io.shopverse.labs.outbox;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderProjectionRepository
        extends JpaRepository<OrderProjectionEntity, UUID> {
}
