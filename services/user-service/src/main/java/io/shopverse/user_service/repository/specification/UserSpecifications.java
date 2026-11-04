package io.shopverse.user_service.repository.specification;

import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.model.UserFilter;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public final class UserSpecifications {

    private UserSpecifications() {
    }

    public static Specification<User> from(UserFilter filter) {
        return Specification.allOf(
                search(filter.search()),
                hasStatus(filter.status()),
                hasRole(filter.role())
        );
    }

    private static Specification<User> search(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("username")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("firstName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("lastName")), pattern)
            );
        };
    }

    private static Specification<User> hasStatus(UserStatus status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null) {
                return criteriaBuilder.notEqual(root.get("status"), UserStatus.DELETED);
            }

            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    private static Specification<User> hasRole(String roleName) {
        return (root, query, criteriaBuilder) -> {
            if (roleName == null || roleName.isBlank()) {
                return criteriaBuilder.conjunction();
            }

            query.distinct(true);
            Join<User, Role> roles = root.join("roles", JoinType.LEFT);
            return criteriaBuilder.equal(
                    criteriaBuilder.lower(roles.get("roleName")),
                    roleName.trim().toLowerCase()
            );
        };
    }
}
