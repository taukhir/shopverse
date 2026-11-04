package io.shopverse.inventory_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * A parent blueprint class that automatically tracks creation and modification timestamps.
 * Other database entities will extend this class to avoid repeating timestamp code.
 */
@Getter
@MappedSuperclass // Tells JPA this is not a table itself, but its fields belong to child tables
@EntityListeners(AuditingEntityListener.class) // Activates Spring Data Auditing to automatically inject timestamps
public abstract class BaseAuditableEntity {

    @CreatedDate // Spring automatically sets this timestamp on the first SQL INSERT statement
    @Column(
            nullable = false,   // Database constraint: This column cannot be null
            updatable = false   // Database constraint: Prevents SQL UPDATE queries from ever modifying this field
    )
    private Instant createdAt; // Stores the exact date/time the record was created in UTC

    @LastModifiedDate // Spring automatically updates this timestamp on every SQL UPDATE statement
    @Column(nullable = false) // Database constraint: This column cannot be null
    private Instant updatedAt; // Stores the exact date/time the record was last modified in UTC
}
