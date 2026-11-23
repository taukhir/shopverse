package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    @EntityGraph(attributePaths = {"roles", "roles.permissions", "groups", "groups.roles", "groups.roles.permissions"})
    Optional<User> findByUsername(String username);

    @Override
    @EntityGraph(attributePaths = {"roles", "roles.permissions", "groups", "groups.roles", "groups.roles.permissions"})
    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    @Query("select distinct u from User u join u.groups g where g.id = :groupId")
    Page<User> findMembersByGroupId(@Param("groupId") Long groupId, Pageable pageable);

    @Query("select distinct u from User u left join fetch u.roles r left join fetch r.permissions left join fetch u.groups g left join fetch g.roles gr left join fetch gr.permissions where u.id in :ids")
    java.util.List<User> findAllWithAuthoritiesByIdIn(@Param("ids") java.util.Collection<Long> ids);
}
