package io.shopverse.user_service.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserAddressRequest(
        @NotBlank
        @Size(max = 60)
        String label,

        @NotBlank
        @Size(max = 160)
        String recipientName,

        @Pattern(regexp = "^$|^[+]?[0-9]{10,15}$", message = "Phone number must contain 10-15 digits and may start with +")
        String phoneNumber,

        @NotBlank
        @Size(max = 220)
        String line1,

        @Size(max = 220)
        String line2,

        @NotBlank
        @Size(max = 100)
        String city,

        @NotBlank
        @Size(max = 100)
        String state,

        @NotBlank
        @Size(max = 30)
        String postalCode,

        @NotBlank
        @Size(max = 100)
        String country,

        Boolean defaultAddress
) {
}
