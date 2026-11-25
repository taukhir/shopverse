package io.shopverse.user_service.service.provisioning;

import io.shopverse.user_service.constants.AuditActions;
import io.shopverse.user_service.constants.AuditDetails;
import io.shopverse.user_service.constants.SecurityConstants;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.Role;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.enums.UserStatus;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.RegisterCustomerRequest;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.lookup.LookupService;
import io.shopverse.user_service.service.credentials.PasswordHistoryService;
import io.shopverse.user_service.service.audit.UserAuditService;
import io.shopverse.user_service.service.audit.UserAuditEventRecorder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class UserProvisioningServiceImpl implements UserProvisioningService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordHistoryService passwordHistoryService;
    private final UserAuditService userAuditService;
    private final UserAuditEventRecorder auditEventRecorder;
    private final LookupService lookupService;

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        log.info("Creating user; usernamePresent={}, emailPresent={}",
                request.username() != null && !request.username().isBlank(),
                request.email() != null && !request.email().isBlank());
        if (userRepository.existsByUsername(request.username())) {
            throw new DuplicateResourceException("Username already exists");
        }

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmail(normalizedEmail)) {
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
        auditEventRecorder.record(savedUser, AuditActions.USER_CREATED, "User created", AuditDetails.USER_ACCOUNT_CREATED);
        log.info("Created user id={}", savedUser.getId());
        return UserMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse registerCustomer(RegisterCustomerRequest request) {
        log.info("Registering customer; usernamePresent={}, emailPresent={}",
                request.username() != null && !request.username().isBlank(),
                request.email() != null && !request.email().isBlank());
        return createUser(new CreateUserRequest(
                request.username(), request.email(), request.password(), request.firstName(),
                request.lastName(), request.phoneNumber(), Set.of(SecurityConstants.ROLE_CUSTOMER)
        ));
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            return new HashSet<>();
        }
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
