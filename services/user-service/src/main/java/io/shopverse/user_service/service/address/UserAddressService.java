package io.shopverse.user_service.service.address;

import io.shopverse.user_service.dto.UserAddressResponse;
import io.shopverse.user_service.model.UserAddressRequest;

import java.util.List;
import java.util.Optional;

public interface UserAddressService {

    List<UserAddressResponse> getAddresses(String username);

    Optional<UserAddressResponse> getAddress(String username, Long addressId);

    UserAddressResponse createAddress(String username, UserAddressRequest request);

    UserAddressResponse updateAddress(String username, Long addressId, UserAddressRequest request);

    void deleteAddress(String username, Long addressId);
}
