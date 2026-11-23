package io.shopverse.user_service.controller.account;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.constants.ResilienceConstants;
import io.shopverse.user_service.dto.UserAddressResponse;
import io.shopverse.user_service.model.UserAddressRequest;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.service.UserAddressService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping({ApiConstants.CURRENT_ACCOUNT + "/addresses", ApiConstants.ACCOUNTS + "/me/addresses", ApiConstants.USERS + "/me/addresses"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Account Addresses", description = "Authenticated customer address book APIs")
@RateLimiter(name = ResilienceConstants.API_RATE_LIMITER)
@Bulkhead(name = ResilienceConstants.API_BULKHEAD, type = Bulkhead.Type.SEMAPHORE)
public class UserAddressController {

    private final UserAddressService userAddressService;

    @GetMapping
    public ResponseEntity<List<UserAddressResponse>> getCurrentUserAddresses(Principal principal) {
        return ResponseEntity.ok(userAddressService.getAddresses(principal.getName()));
    }

    @GetMapping("/{addressId}")
    public ResponseEntity<UserAddressResponse> getCurrentUserAddress(Principal principal, @PathVariable Long addressId) {
        return userAddressService.getAddress(principal.getName(), addressId)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found with id: " + addressId));
    }

    @PostMapping
    public ResponseEntity<UserAddressResponse> createCurrentUserAddress(
            Principal principal,
            @Valid @RequestBody UserAddressRequest request
    ) {
        log.info("Authenticated address creation requested for username={}", principal.getName());
        UserAddressResponse created = userAddressService.createAddress(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{addressId}").buildAndExpand(created.id()).toUri())
                .body(created);
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<UserAddressResponse> updateCurrentUserAddress(
            Principal principal,
            @PathVariable Long addressId,
            @Valid @RequestBody UserAddressRequest request
    ) {
        log.info("Authenticated address update requested for username={} addressId={}", principal.getName(), addressId);
        return ResponseEntity.ok(userAddressService.updateAddress(principal.getName(), addressId, request));
    }

    @DeleteMapping("/{addressId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCurrentUserAddress(
            Principal principal,
            @PathVariable Long addressId
    ) {
        log.warn("Authenticated address deletion requested for username={} addressId={}", principal.getName(), addressId);
        userAddressService.deleteAddress(principal.getName(), addressId);
    }
}
