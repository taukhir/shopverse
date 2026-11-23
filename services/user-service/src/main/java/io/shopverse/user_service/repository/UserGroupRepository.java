package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.UserGroup;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface UserGroupRepository extends JpaRepository<UserGroup, Long>, JpaSpecificationExecutor<UserGroup> {

    @EntityGraph(attributePaths = "roles")
    Optional<UserGroup> findByGroupName(String groupName);

    @Override
    @EntityGraph(attributePaths = "roles")
    Optional<UserGroup> findById(Long id);

    boolean existsByGroupName(String groupName);

    @org.springframework.data.jpa.repository.Query("select count(u) from User u join u.groups g where g.id = :groupId")
    long countMembersByGroupId(@org.springframework.data.repository.query.Param("groupId") Long groupId);
}
