package io.shopverse.user_service.service.impl;

import io.shopverse.user_service.dto.UserAddressResponse;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.entities.UserAddress;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserAddressMapper;
import io.shopverse.user_service.model.UserAddressRequest;
import io.shopverse.user_service.repository.UserAddressRepository;
import io.shopverse.user_service.repository.UserRepository;
import io.shopverse.user_service.service.UserAddressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserAddressServiceImpl implements UserAddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    public List<UserAddressResponse> getAddresses(String username) {
        log.info("Loading addresses for username={}", username);
        return addressRepository.findByUserUsernameOrderByDefaultAddressDescUpdatedAtDescIdDesc(username)
                .stream()
                .map(UserAddressMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public UserAddressResponse createAddress(String username, UserAddressRequest request) {
        log.info("Creating address for username={}", username);
        User user = findUser(username);
        boolean firstAddress = !addressRepository.existsByUserUsername(username);
        boolean makeDefault = firstAddress || Boolean.TRUE.equals(request.defaultAddress());

        UserAddress address = UserAddress.builder()
                .user(user)
                .label(trim(request.label()))
                .recipientName(trim(request.recipientName()))
                .phoneNumber(trimToNull(request.phoneNumber()))
                .line1(trim(request.line1()))
                .line2(trimToNull(request.line2()))
                .city(trim(request.city()))
                .state(trim(request.state()))
                .postalCode(trim(request.postalCode()))
                .country(trim(request.country()))
                .defaultAddress(makeDefault)
                .build();

        UserAddress saved = addressRepository.save(address);
        if (makeDefault) {
            addressRepository.clearOtherDefaultAddresses(username, saved.getId());
        }
        log.info("Created address id={} for username={}", saved.getId(), username);
        return UserAddressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserAddressResponse updateAddress(String username, Long addressId, UserAddressRequest request) {
        log.info("Updating address id={} for username={}", addressId, username);
        UserAddress address = findAddress(username, addressId);
        address.setLabel(trim(request.label()));
        address.setRecipientName(trim(request.recipientName()));
        address.setPhoneNumber(trimToNull(request.phoneNumber()));
        address.setLine1(trim(request.line1()));
        address.setLine2(trimToNull(request.line2()));
        address.setCity(trim(request.city()));
        address.setState(trim(request.state()));
        address.setPostalCode(trim(request.postalCode()));
        address.setCountry(trim(request.country()));

        if (Boolean.TRUE.equals(request.defaultAddress())) {
            address.setDefaultAddress(true);
        }

        UserAddress saved = addressRepository.save(address);
        if (saved.isDefaultAddress()) {
            addressRepository.clearOtherDefaultAddresses(username, saved.getId());
        }
        log.info("Updated address id={} for username={}", saved.getId(), username);
        return UserAddressMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAddress(String username, Long addressId) {
        log.warn("Deleting address id={} for username={}", addressId, username);
        UserAddress address = findAddress(username, addressId);
        boolean deletedDefault = address.isDefaultAddress();
        addressRepository.delete(address);
        addressRepository.flush();

        if (deletedDefault) {
            promoteLatestAddress(username);
        }
        log.info("Deleted address id={} for username={}", addressId, username);
    }

    private void promoteLatestAddress(String username) {
        List<UserAddress> remaining = addressRepository.findByUserUsernameOrderByDefaultAddressDescUpdatedAtDescIdDesc(username);
        remaining.stream()
                .max(Comparator.comparing(UserAddress::getUpdatedAt, Comparator.nullsFirst(Comparator.naturalOrder()))
                        .thenComparing(UserAddress::getId))
                .ifPresent(address -> {
                    address.setDefaultAddress(true);
                    UserAddress saved = addressRepository.save(address);
                    addressRepository.clearOtherDefaultAddresses(username, saved.getId());
                    log.info("Promoted address id={} as default for username={}", saved.getId(), username);
                });
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }

    private UserAddress findAddress(String username, Long addressId) {
        return addressRepository.findByIdAndUserUsername(addressId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
    }

    private String trim(String value) {
        return value == null ? null : value.trim();
    }

    private String trimToNull(String value) {
        String trimmed = trim(value);
        return trimmed == null || trimmed.isBlank() ? null : trimmed;
    }
}
