package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.UserAudit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuditRepository extends JpaRepository<UserAudit, Long> {
}
