package io.shopverse.user_service.service.group;

import io.shopverse.platform.web.pagination.PageMapper;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.RoleResponse;
import io.shopverse.user_service.dto.UserGroupResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.config.CacheConfig;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.UserGroup;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceInUseException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.CreateGroupRequest;
import io.shopverse.user_service.model.UpdateGroupRequest;
import io.shopverse.user_service.model.ReplaceGroupRequest;
import io.shopverse.user_service.repository.RoleRepository;
import io.shopverse.user_service.repository.UserGroupRepository;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.repository.specification.UserGroupSpecifications;
import io.shopverse.user_service.service.audit.AdminAuditEventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserGroupServiceImpl implements UserGroupService {
    private final UserGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AdminAuditEventService auditService;

    @Override
    public PageResponse<UserGroupResponse> getGroups(String search, Pageable pageable) {
        return PageMapper.toResponse(groupRepository.findAll(UserGroupSpecifications.search(search), pageable), this::toResponse);
    }

    @Override
    public UserGroupResponse getGroup(Long id) { return toResponse(findGroup(id)); }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse createGroup(CreateGroupRequest request) {
        String name = request.groupName().trim();
        if (name.isBlank()) {
            throw new io.shopverse.user_service.exceptions.BadRequestException("Group name must not be blank");
        }
        if (groupRepository.existsByGroupName(name)) {
            throw new DuplicateResourceException("Group already exists");
        }
        UserGroup group = UserGroup.builder().groupName(name).description(trim(request.description()))
                .roles(resolveRoles(request.roleIds())).build();
        UserGroup saved = groupRepository.save(group);
        audit(saved, "GROUP_CREATED");
        return toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse updateGroup(Long id, UpdateGroupRequest request) {
        UserGroup group = findGroup(id);
        if (request.groupName() != null) {
            String name = request.groupName().trim();
            if (name.isBlank()) {
                throw new io.shopverse.user_service.exceptions.BadRequestException("Group name must not be blank");
            }
            if (!name.equals(group.getGroupName()) && groupRepository.existsByGroupName(name)) {
                throw new DuplicateResourceException("Group already exists");
            }
            group.setGroupName(name);
        }
        if (request.description() != null) {
            group.setDescription(trim(request.description()));
        }
        if (request.roleIds() != null) {
            group.setRoles(resolveRoles(request.roleIds()));
        }
        UserGroup saved = groupRepository.save(group);
        audit(saved, "GROUP_UPDATED");
        return toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse replaceGroup(Long id, ReplaceGroupRequest request) {
        UserGroup group = findGroup(id);
        String name = request.groupName().trim();
        if (name.isBlank()) {
            throw new io.shopverse.user_service.exceptions.BadRequestException("Group name must not be blank");
        }
        if (!name.equals(group.getGroupName()) && groupRepository.existsByGroupName(name)) {
            throw new DuplicateResourceException("Group already exists");
        }
        group.setGroupName(name);
        group.setDescription(trim(request.description()));
        group.setRoles(resolveRoles(request.roleIds() == null ? Set.of() : request.roleIds()));
        UserGroup saved = groupRepository.save(group);
        audit(saved, "GROUP_REPLACED");
        return toResponse(saved);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public void deleteGroup(Long id) {
        UserGroup group = findGroup(id);
        if (groupRepository.countMembersByGroupId(id) > 0) {
            throw new ResourceInUseException("Group has members; remove members before deleting it");
        }
        group.getRoles().clear();
        groupRepository.flush();
        audit(group, "GROUP_DELETED");
        groupRepository.delete(group);
    }

    @Override
    public PageResponse<UserSummaryResponse> getMembers(Long groupId, Pageable pageable) {
        findGroup(groupId);
        return PageMapper.toResponse(userRepository.findMembersByGroupId(groupId, pageable), UserMapper::toUserSummaryResponse);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse addMember(Long groupId, Long userId) {
        UserGroup group = findGroup(groupId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getGroups().add(group)) {
            userRepository.save(user);
        }
        audit(group, "GROUP_MEMBER_ADDED");
        return toResponse(group);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse removeMember(Long groupId, Long userId) {
        UserGroup group = findGroup(groupId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getGroups().remove(group)) {
            userRepository.save(user);
        }
        audit(group, "GROUP_MEMBER_REMOVED");
        return toResponse(group);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse addRole(Long groupId, Long roleId) {
        UserGroup group = findGroup(groupId);
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));
        if (group.getRoles().add(role)) {
            groupRepository.save(group);
        }
        audit(group, "GROUP_ROLE_ADDED");
        return toResponse(group);
    }

    @Override
    @Transactional
    @CacheEvict(cacheNames = CacheConfig.ROLES_BY_NAME, allEntries = true)
    public UserGroupResponse removeRole(Long groupId, Long roleId) {
        UserGroup group = findGroup(groupId);
        Role role = roleRepository.findById(roleId).orElseThrow(() -> new ResourceNotFoundException("Role not found with id: " + roleId));
        if (group.getRoles().remove(role)) {
            groupRepository.save(group);
        }
        audit(group, "GROUP_ROLE_REMOVED");
        return toResponse(group);
    }

    private UserGroup findGroup(Long id) {
        return groupRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Group not found with id: " + id));
    }

    private Set<Role> resolveRoles(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new HashSet<>();
        }
        Set<Role> roles = new HashSet<>(roleRepository.findAllById(ids));
        if (roles.size() != ids.size()) {
            throw new ResourceNotFoundException("One or more roles were not found");
        }
        return roles;
    }

    private UserGroupResponse toResponse(UserGroup group) {
        Set<RoleResponse> roles = group.getRoles().stream().map(UserMapper::toRoleResponse).collect(Collectors.toCollection(java.util.LinkedHashSet::new));
        long memberCount = groupRepository.countMembersByGroupId(group.getId());
        return new UserGroupResponse(group.getId(), group.getGroupName(), group.getDescription(), memberCount, roles);
    }

    private void audit(UserGroup group, String action) {
        auditService.record("USERS", action, action.replace('_', ' '), "SUCCESS", null, action + ": " + group.getGroupName(),
                action + ": " + group.getGroupName(), "GROUP", String.valueOf(group.getId()), null, Map.of("groupName", group.getGroupName()));
    }

    private String trim(String value) { return value == null ? null : value.trim(); }
}
