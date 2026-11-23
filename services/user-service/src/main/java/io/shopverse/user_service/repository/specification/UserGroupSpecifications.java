package io.shopverse.user_service.repository.specification;

import io.shopverse.user_service.entities.UserGroup;
import org.springframework.data.jpa.domain.Specification;

public final class UserGroupSpecifications {
    private UserGroupSpecifications() { }

    public static Specification<UserGroup> search(String search) {
        if (search == null || search.isBlank()) return null;
        String pattern = "%" + search.trim().toLowerCase() + "%";
        return (root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("groupName")), pattern),
                builder.like(builder.lower(root.get("description")), pattern)
        );
    }
}
