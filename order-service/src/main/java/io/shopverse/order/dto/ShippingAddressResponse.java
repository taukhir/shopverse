package io.shopverse.order.dto;

public record ShippingAddressResponse(
        String recipientName,
        String phoneNumber,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        String country
) {
}
