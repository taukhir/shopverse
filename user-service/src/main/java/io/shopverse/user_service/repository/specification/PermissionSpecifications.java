package io.shopverse.user_service.repository.specification;

import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.model.PermissionFilter;
import org.springframework.data.jpa.domain.Specification;

public final class PermissionSpecifications {

    private PermissionSpecifications() {
    }

    public static Specification<Permission> from(PermissionFilter filter) {
        return Specification.allOf(
                search(filter.search()),
                hasModule(filter.moduleName())
        );
    }

    private static Specification<Permission> search(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("permissionName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
            );
        };
    }

    private static Specification<Permission> hasModule(String moduleName) {
        return (root, query, criteriaBuilder) -> {
            if (moduleName == null || moduleName.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            return criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("moduleName")),
                    moduleName.trim().toLowerCase()
            );
        };
    }
}
