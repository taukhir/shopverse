package io.shopverse.user_service.service;

import io.shopverse.user_service.dto.PageResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.UserFilter;
import org.springframework.data.domain.Pageable;

public interface UserService {

    PageResponse<UserSummaryResponse> getUsers(UserFilter filter, Pageable pageable);

    UserResponse getUser(Long id);

    UserResponse loadAuthenticatedUserByUsername(String username);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    void changePassword(Long id, ChangePasswordRequest request);

    void resetPassword(Long id, ResetPasswordRequest request);

    void deleteUser(Long id);
}
