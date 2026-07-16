package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.AdminAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AdminAuditEventRepository extends JpaRepository<AdminAuditEvent, Long>, JpaSpecificationExecutor<AdminAuditEvent> {
}
