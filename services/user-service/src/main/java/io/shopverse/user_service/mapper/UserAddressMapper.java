package io.shopverse.user_service.mapper;

import io.shopverse.user_service.dto.UserAddressResponse;
import io.shopverse.user_service.entities.UserAddress;

public final class UserAddressMapper {

    private UserAddressMapper() {
    }

    public static UserAddressResponse toResponse(UserAddress address) {
        return new UserAddressResponse(
                address.getId(),
                address.getLabel(),
                address.getRecipientName(),
                address.getPhoneNumber(),
                address.getLine1(),
                address.getLine2(),
                address.getCity(),
                address.getState(),
                address.getPostalCode(),
                address.getCountry(),
                address.isDefaultAddress(),
                address.getCreatedAt(),
                address.getUpdatedAt()
        );
    }
}
