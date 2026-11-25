package io.shopverse.user_service.service.admin;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.model.ChangePasswordRequest;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.ReplaceUserRequest;
import io.shopverse.user_service.model.ResetPasswordRequest;
import io.shopverse.user_service.model.UpdateUserRequest;
import io.shopverse.user_service.model.UserFilter;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {

    PageResponse<UserSummaryResponse> getUsers(UserFilter filter, Pageable pageable);

    UserResponse getUser(Long id);

    UserResponse createUser(CreateUserRequest request);

    UserResponse updateUser(Long id, UpdateUserRequest request);

    UserResponse replaceUser(Long id, ReplaceUserRequest request);

    void changePassword(Long id, ChangePasswordRequest request);

    void resetPassword(Long id, ResetPasswordRequest request);

    void deleteUser(Long id);
}
