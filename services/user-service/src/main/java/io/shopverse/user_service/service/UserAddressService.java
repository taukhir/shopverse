package io.shopverse.user_service.service;

import io.shopverse.user_service.dto.UserAddressResponse;
import io.shopverse.user_service.model.UserAddressRequest;

import java.util.List;

public interface UserAddressService {

    List<UserAddressResponse> getAddresses(String username);

    UserAddressResponse createAddress(String username, UserAddressRequest request);

    UserAddressResponse updateAddress(String username, Long addressId, UserAddressRequest request);

    void deleteAddress(String username, Long addressId);
}
