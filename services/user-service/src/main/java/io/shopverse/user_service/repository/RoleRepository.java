package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.Role;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long>, JpaSpecificationExecutor<Role> {

    @EntityGraph(attributePaths = "permissions")
    Optional<Role> findByRoleName(String roleName);

    @Override
    @EntityGraph(attributePaths = "permissions")
    Optional<Role> findById(Long id);

    boolean existsByRoleName(String roleName);
}
