package io.shopverse.user_service.service.account;

import io.shopverse.user_service.constants.AuditActions;
import io.shopverse.user_service.constants.AuditDetails;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.exceptions.DuplicateResourceException;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.model.RegisterCustomerRequest;
import io.shopverse.user_service.model.UpdateProfileRequest;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.audit.UserAuditService;
import io.shopverse.user_service.service.audit.UserAuditEventRecorder;
import io.shopverse.user_service.service.provisioning.UserProvisioningService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AccountServiceImpl implements AccountService {

    private final UserRepository userRepository;
    private final UserAuditService userAuditService;
    private final UserAuditEventRecorder auditEventRecorder;
    private final UserProvisioningService userProvisioningService;

    @Override
    @Transactional
    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        log.info("Updating authenticated profile");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));

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

        User savedUser = userRepository.save(user);
        userAuditService.record(savedUser, AuditActions.USER_UPDATED, AuditDetails.USER_ACCOUNT_UPDATED);
        auditEventRecorder.record(savedUser, "USER_PROFILE_UPDATED", "User profile updated",
                "User updated their account profile");
        log.info("Updated authenticated profile userId={}", savedUser.getId());
        return UserMapper.toUserResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse registerCustomer(RegisterCustomerRequest request) {
        return userProvisioningService.registerCustomer(request);
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
