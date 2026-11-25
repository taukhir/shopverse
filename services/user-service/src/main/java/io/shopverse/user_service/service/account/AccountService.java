package io.shopverse.user_service.service.account;

import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.model.RegisterCustomerRequest;
import io.shopverse.user_service.model.UpdateProfileRequest;

public interface AccountService {

    UserResponse updateProfile(String username, UpdateProfileRequest request);

    UserResponse registerCustomer(RegisterCustomerRequest request);
}
