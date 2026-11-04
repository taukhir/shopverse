package io.shopverse.user_service.repository.specification;

import io.shopverse.user_service.entities.AdminAuditEvent;
import io.shopverse.user_service.model.AdminAuditEventFilter;
import org.springframework.data.jpa.domain.Specification;

public final class AdminAuditEventSpecifications {

    private AdminAuditEventSpecifications() {
    }

    public static Specification<AdminAuditEvent> from(AdminAuditEventFilter filter) {
        return Specification
                .where(matches("area", filter.area()))
                .and(matches("actor", filter.actor()))
                .and(matches("result", filter.result()))
                .and(search(filter.search()));
    }

    private static Specification<AdminAuditEvent> matches(String field, String value) {
        return (root, query, criteriaBuilder) -> {
            if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(criteriaBuilder.upper(root.get(field)), value.toUpperCase());
        };
    }

    private static Specification<AdminAuditEvent> search(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return criteriaBuilder.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("action")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("message")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("subjectId")), pattern)
            );
        };
    }
}
