package io.shopverse.user_service.repository.specification;

import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.model.RoleFilter;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class RoleSpecifications {

    private RoleSpecifications() {
    }

    public static Specification<Role> from(RoleFilter filter) {
        return Specification.allOf(
                search(filter.search()),
                hasPermission(filter.permission())
        );
    }

    private static Specification<Role> search(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("roleName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
            );
        };
    }

    private static Specification<Role> hasPermission(String permissionName) {
        return (root, query, criteriaBuilder) -> {
            if (permissionName == null || permissionName.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            query.distinct(true);
            Join<Role, Permission> permissions = root.join("permissions", JoinType.LEFT);
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(permissions.get("permissionName")),
                    permissionName.trim().toLowerCase()
            );
        };
    }
}
