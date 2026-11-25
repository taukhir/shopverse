package io.shopverse.user_service.service.admin;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.constants.AuditActions;
import io.shopverse.user_service.constants.AuditDetails;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.BadRequestException;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ReplaceUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.UserFilter;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.repository.specification.UserSpecifications;
import io.shopverse.user_service.service.lookup.LookupService;
import io.shopverse.user_service.service.credentials.PasswordHistoryService;
import io.shopverse.user_service.service.audit.UserAuditService;
import io.shopverse.user_service.service.audit.UserAuditEventRecorder;
import io.shopverse.user_service.service.provisioning.UserProvisioningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordHistoryService passwordHistoryService;
    private final UserAuditService userAuditService;
    private final UserAuditEventRecorder auditEventRecorder;
    private final LookupService lookupService;
    private final UserProvisioningService userProvisioningService;

    @Override
    public PageResponse<UserSummaryResponse> getUsers(UserFilter filter, Pageable pageable) {
        log.info("Loading users with filter searchPresent={}, statusPresent={}, rolePresent={}, page={}, size={}",
                filter.search() != null && !filter.search().isBlank(),
                filter.status() != null,
                filter.role() != null && !filter.role().isBlank(),
                pageable.getPageNumber(), pageable.getPageSize());
        var usersPage = userRepository.findAll(UserSpecifications.from(filter), pageable);
        var usersWithAuthorities = userRepository.findAllWithAuthoritiesByIdIn(
                usersPage.getContent().stream().map(User::getId).toList());
        var summariesById = usersWithAuthorities.stream()
                .collect(Collectors.toMap(User::getId, UserMapper::toUserSummaryResponse));
        return new PageResponse<>(
                usersPage.getContent().stream()
                        .map(user -> summariesById.getOrDefault(user.getId(), UserMapper.toUserSummaryResponse(user)))
                        .toList(),
                usersPage.getNumber(), usersPage.getSize(), usersPage.getTotalElements(), usersPage.getTotalPages(),
                usersPage.isFirst(), usersPage.isLast());
    }

    @Override
    public UserResponse getUser(Long id) {
        return UserMapper.toUserResponse(findUser(id));
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        return userProvisioningService.createUser(request);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = findUser(id);
        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                throw new DuplicateResourceException("Username already exists");
            }
            user.setUsername(request.username());
        }
        String updatedEmail = normalizeEmail(request.email());
        if (updatedEmail != null && !updatedEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(updatedEmail)) {
                throw new DuplicateResourceException("Email already exists");
            }
            user.setEmail(updatedEmail);
        }
        if (request.firstName() != null) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber());
        }
        if (request.status() != null) {
            user.setStatus(request.status());
        }
        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }
        if (request.accountNonLocked() != null) {
            user.setAccountNonLocked(request.accountNonLocked());
        }
        if (request.roles() != null) {
            user.setRoles(resolveRoles(request.roles()));
        }
        return saveUserUpdate(user, "User updated");
    }

    @Override
    @Transactional
    public UserResponse replaceUser(Long id, ReplaceUserRequest request) {
        User user = findUser(id);
        String username = request.username().trim();
        if (!username.equals(user.getUsername()) && userRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Username already exists");
        }
        String email = normalizeEmail(request.email());
        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email already exists");
        }
        user.setUsername(username);
        user.setEmail(email);
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setStatus(request.status());
        user.setEnabled(request.enabled());
        user.setAccountNonLocked(request.accountNonLocked());
        user.setRoles(resolveRoles(request.roles() == null ? Set.of() : request.roles()));
        return saveUserUpdate(user, "User replaced");
    }

    @Override
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = findUser(id);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        updatePassword(user, request.newPassword(), AuditActions.PASSWORD_CHANGED, AuditDetails.USER_PASSWORD_CHANGED);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        updatePassword(findUser(id), request.newPassword(), AuditActions.PASSWORD_RESET,
                AuditDetails.USER_PASSWORD_RESET_BY_ADMIN);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = findUser(id);
        user.setStatus(UserStatus.DELETED);
        user.setEnabled(false);
        user.setAccountNonLocked(false);
        user.setGroups(new HashSet<>());
        User savedUser = userRepository.save(user);
        userAuditService.record(savedUser, AuditActions.USER_DELETED, AuditDetails.USER_ACCOUNT_SOFT_DELETED);
        auditEventRecorder.record(savedUser, AuditActions.USER_DELETED, "User soft deleted",
                AuditDetails.USER_ACCOUNT_SOFT_DELETED);
    }

    private UserResponse saveUserUpdate(User user, String title) {
        User savedUser = userRepository.save(user);
        userAuditService.record(savedUser, AuditActions.USER_UPDATED, AuditDetails.USER_ACCOUNT_UPDATED);
        auditEventRecorder.record(savedUser, AuditActions.USER_UPDATED, title, AuditDetails.USER_ACCOUNT_UPDATED);
        return UserMapper.toUserResponse(savedUser);
    }

    private void updatePassword(User user, String newPassword, String auditAction, String auditDetails) {
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BadRequestException("New password must be different from the current password");
        }
        passwordHistoryService.ensurePasswordWasNotRecentlyUsed(user, newPassword);
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        user.setPasswordChangedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        passwordHistoryService.record(savedUser, encodedPassword);
        userAuditService.record(savedUser, auditAction, auditDetails);
        auditEventRecorder.record(savedUser, auditAction, "User password changed", auditDetails);
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            roles.add(lookupService.findRoleByName(roleName));
        }
        return roles;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
