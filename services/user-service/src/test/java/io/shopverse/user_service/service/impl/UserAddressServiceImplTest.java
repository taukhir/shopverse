package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.UserAddress;
import io.shopverse.user_service.model.UserAddressRequest;
import io.shopverse.user_service.repository.UserAddressRepository;
import io.shopverse.user_service.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertFalse;

@ExtendWith(MockitoExtension.class)
class UserAddressServiceImplTest {
    @Mock private UserAddressRepository addressRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private UserAddressServiceImpl service;

    @Test
    void updateAddressHonorsExplicitFalseDefaultFlag() {
        UserAddress address = UserAddress.builder().id(4L).user(User.builder().username("ahmed").build()).defaultAddress(true).build();
        when(addressRepository.findByIdAndUserUsername(4L, "ahmed")).thenReturn(Optional.of(address));
        when(addressRepository.save(any(UserAddress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateAddress("ahmed", 4L, new UserAddressRequest(
                "Home", "Ahmed", null, "Street 1", null, "Bengaluru", "KA", "560001", "India", false));

        verify(addressRepository).save(address);
        verify(addressRepository, never()).clearOtherDefaultAddresses(any(), any());
        assertFalse(address.isDefaultAddress());
    }
}
