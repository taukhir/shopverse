package io.shopverse.user_service.service.provisioning;

import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.model.CreateUserRequest;
import io.shopverse.user_service.model.RegisterCustomerRequest;

public interface UserProvisioningService {

    UserResponse createUser(CreateUserRequest request);

    UserResponse registerCustomer(RegisterCustomerRequest request);
}
