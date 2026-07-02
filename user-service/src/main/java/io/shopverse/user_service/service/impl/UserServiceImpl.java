package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.constants.AuditActions;
import io.shopverse.user_service.constants.AuditDetails;
import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.BadRequestException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateProfileRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.UserFilter;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.repository.specification.UserSpecifications;
import io.shopverse.user_service.service.LookupService;
import io.shopverse.user_service.service.PasswordHistoryService;
import io.shopverse.user_service.service.UserAuditService;
import io.shopverse.user_service.service.UserService;
import io.shopverse.platform.web.pagination.PageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordHistoryService passwordHistoryService;
    private final UserAuditService userAuditService;
    private final LookupService lookupService;

    @Override
    public PageResponse<UserSummaryResponse> getUsers(UserFilter filter, Pageable pageable) {
        log.info(
                "Loading users with filter searchPresent={}, status={}, role={}, page={}, size={}",
                filter.search() != null && !filter.search().isBlank(),
                filter.status(),
                filter.role(),
                pageable.getPageNumber(),
                pageable.getPageSize()
        );

        PageResponse<UserSummaryResponse> response = PageMapper.toResponse(
                userRepository.findAll(UserSpecifications.from(filter), pageable),
                UserMapper::toUserSummaryResponse
        );
        log.info("Loaded users page with {} items out of {} total items", response.content().size(), response.totalElements());
        return response;
    }

    @Override
    public UserResponse getUser(Long id) {
        log.info("Loading user by id: {}", id);
        UserResponse response = UserMapper.toUserResponse(findUser(id));
        log.info("Loaded user by id: {}", id);
        return response;
    }

    @Override
    public UserResponse loadAuthenticatedUserByUsername(String username) {
        log.info("Loading authenticated user details by username={}", username);
        User user = findUserByName(username);
        UserResponse response = UserMapper.toUserResponse(user);
        log.info(
                "Loaded authenticated user details username={} userId={} status={} roles={}",
                username,
                response.id(),
                response.status(),
                response.roles() == null ? 0 : response.roles().size()
        );
        return response;
    }

    @Override
    @Transactional
    public UserResponse updateAuthenticatedUserProfile(String username, UpdateProfileRequest request) {
        log.info("Updating authenticated profile for username={}", username);
        User user = findUserByName(username);

        String updatedEmail = normalizeEmail(request.email());
        if (updatedEmail != null && !updatedEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(updatedEmail)) {
                log.warn("Profile update rejected for username={} because email already exists: {}", username, updatedEmail);
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

        User savedUser = userRepository.save(user);
        userAuditService.record(savedUser, AuditActions.USER_UPDATED, AuditDetails.USER_ACCOUNT_UPDATED);
        log.info("Updated authenticated profile userId={}", savedUser.getId());
        return UserMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating user username={}, email={}", request.username(), request.email());
        if (userRepository.existsByUsername(request.username())) {
            log.warn("User creation rejected because username already exists: {}", request.username());
            throw new DuplicateResourceException("Username already exists");
        }

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("User creation rejected because email already exists: {}", normalizedEmail);
            throw new DuplicateResourceException("Email already exists");
        }

        String encodedPassword = passwordEncoder.encode(request.password());
        User user = User.builder()
                .uuid(UUID.randomUUID().toString())
                .username(request.username())
                .email(normalizedEmail)
                .password(encodedPassword)
                .firstName(request.firstName())
                .lastName(request.lastName())
                .phoneNumber(request.phoneNumber())
                .status(UserStatus.ACTIVE)
                .accountNonLocked(true)
                .accountNonExpired(true)
                .credentialsNonExpired(true)
                .enabled(true)
                .failedLoginAttempts(0)
                .passwordChangedAt(LocalDateTime.now())
                .roles(resolveRoles(request.roles()))
                .build();

        User savedUser = userRepository.save(user);
        passwordHistoryService.record(savedUser, encodedPassword);
        userAuditService.record(savedUser, AuditActions.USER_CREATED, AuditDetails.USER_ACCOUNT_CREATED);

        log.info("Created user id={}, username={}", savedUser.getId(), savedUser.getUsername());
        return UserMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        log.info("Updating user id: {}", id);
        User user = findUser(id);

        if (request.username() != null && !request.username().equals(user.getUsername())) {
            if (userRepository.existsByUsername(request.username())) {
                log.warn("User update rejected for id={} because username already exists: {}", id, request.username());
                throw new DuplicateResourceException("Username already exists");
            }
            user.setUsername(request.username());
        }

        String updatedEmail = normalizeEmail(request.email());
        if (updatedEmail != null && !updatedEmail.equals(user.getEmail())) {
            if (userRepository.existsByEmail(updatedEmail)) {
                log.warn("User update rejected for id={} because email already exists: {}", id, updatedEmail);
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

        User savedUser = userRepository.save(user);
        userAuditService.record(savedUser, AuditActions.USER_UPDATED, AuditDetails.USER_ACCOUNT_UPDATED);

        log.info("Updated user id={}", savedUser.getId());
        return UserMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        log.info("Changing password for user id: {}", id);
        User user = findUser(id);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            log.warn("Password change rejected because current password did not match for user id: {}", id);
            throw new BadRequestException("Current password is incorrect");
        }

        updatePassword(user, request.newPassword(), AuditActions.PASSWORD_CHANGED, AuditDetails.USER_PASSWORD_CHANGED);
        log.info("Changed password for user id: {}", id);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, ResetPasswordRequest request) {
        log.warn("Resetting password for user id: {}", id);
        User user = findUser(id);
        updatePassword(user, request.newPassword(), AuditActions.PASSWORD_RESET, AuditDetails.USER_PASSWORD_RESET_BY_ADMIN);
        log.info("Reset password for user id: {}", id);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        log.warn("Soft deleting user id: {}", id);
        User user = findUser(id);
        user.setStatus(UserStatus.DELETED);
        user.setEnabled(false);
        user.setAccountNonLocked(false);
        User savedUser = userRepository.save(user);
        userAuditService.record(savedUser, AuditActions.USER_DELETED, AuditDetails.USER_ACCOUNT_SOFT_DELETED);
        log.info("Soft deleted user id={}", savedUser.getId());
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("User not found by id: {}", id);
                    return new ResourceNotFoundException("User not found with id: " + id);
                });
    }

    private User findUserByName(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User not found by username: {}", username);
                    return new ResourceNotFoundException("User not found with username: " + username);
                });
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            log.info("No roles supplied for user operation");
            return new HashSet<>();
        }

        log.info("Resolving {} roles for user operation", roleNames.size());
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            roles.add(lookupService.findRoleByName(roleName));
        }
        return roles;
    }

    private void updatePassword(User user, String newPassword, String auditAction, String auditDetails) {
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            log.warn("Password update rejected because new password matched current password for user id: {}", user.getId());
            throw new BadRequestException("New password must be different from the current password");
        }

        passwordHistoryService.ensurePasswordWasNotRecentlyUsed(user, newPassword);
        String encodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(encodedPassword);
        user.setPasswordChangedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        passwordHistoryService.record(savedUser, encodedPassword);
        userAuditService.record(savedUser, auditAction, auditDetails);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
