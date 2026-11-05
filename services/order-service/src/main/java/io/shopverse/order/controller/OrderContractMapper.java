package io.shopverse.order.controller;

import io.shopverse.contracts.order.CatalogItemResponse;
import io.shopverse.contracts.order.CheckoutRequest;
import io.shopverse.contracts.order.OrderItemResponse;
import io.shopverse.contracts.order.OrderResponse;
import io.shopverse.contracts.order.OrderTimelineResponse;
import io.shopverse.contracts.order.ShippingAddressResponse;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

/** Maps service-owned application data to the generated HTTP contract. */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface OrderContractMapper {

    io.shopverse.order.dto.CheckoutRequest toApplication(CheckoutRequest request);

    ShippingAddressResponse toContract(io.shopverse.order.dto.ShippingAddressResponse value);

    OrderItemResponse toContract(io.shopverse.order.dto.OrderItemResponse value);

    OrderResponse toContract(io.shopverse.order.dto.OrderResponse value);

    OrderTimelineResponse toContract(io.shopverse.order.dto.OrderTimelineResponse value);

    CatalogItemResponse toContract(io.shopverse.order.dto.CatalogItemResponse value);
}
