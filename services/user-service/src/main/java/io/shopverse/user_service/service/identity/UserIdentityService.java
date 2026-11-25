package io.shopverse.user_service.service.identity;

import io.shopverse.user_service.dto.UserResponse;

public interface UserIdentityService {

    UserResponse getByUsername(String username);
}
