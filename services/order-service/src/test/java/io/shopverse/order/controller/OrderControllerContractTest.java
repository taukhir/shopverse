package io.shopverse.order.controller;

import io.shopverse.order.dto.CheckoutReviewResponse;
import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.ShippingAddressResponse;
import io.shopverse.order.exception.ApiExceptionHandler;
import io.shopverse.order.service.CatalogService;
import io.shopverse.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.MethodValidationPostProcessor;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises MVC binding, validation and the real mapper; security has separate authorization tests.
 */
@SpringJUnitConfig(OrderControllerContractTest.TestConfig.class)
@WebAppConfiguration
class OrderControllerContractTest {

    private static final String ADDRESS = """
        {"recipientName":"Test Customer","phoneNumber":"+919876543210",
         "line1":"12 Test Road","line2":"Unit 4","city":"Bengaluru",
         "state":"Karnataka","postalCode":"560001","country":"IN"}
        """;

    @Autowired
    private WebApplicationContext context;
    @MockitoBean
    private OrderService orderService;
    @MockitoBean
    private CatalogService catalogService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void validCheckoutMapsRequestAndReturnsCreatedContract() throws Exception {
        var response = new OrderResponse(7L, "ORD-TEST", "corr-test", "checkout-test", "alice",
            "PENDING_INVENTORY", "INR", new BigDecimal("39.80"),
            new ShippingAddressResponse("Test Customer", "+919876543210", "12 Test Road",
                "Unit 4", "Bengaluru", "Karnataka", "560001", "IN"),
            List.of(new OrderItemResponse(101L, "Test Product", 2, new BigDecimal("19.90"))),
            Instant.parse("2026-11-17T12:34:56.123456Z"));
        given(orderService.checkout(any(), eq("alice"), isNull(), eq("checkout-test")))
            .willReturn(response);

        mvc.perform(checkout(body("[{\"productId\":101,\"quantity\":2}]", ADDRESS))
                .header("Idempotency-Key", "checkout-test"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(7))
            .andExpect(jsonPath("$.orderNumber").value("ORD-TEST"))
            .andExpect(jsonPath("$.correlationId").value("corr-test"))
            .andExpect(jsonPath("$.idempotencyKey").value("checkout-test"))
            .andExpect(jsonPath("$.customerUsername").value("alice"))
            .andExpect(jsonPath("$.status").value("PENDING_INVENTORY"))
            .andExpect(jsonPath("$.currency").value("INR"))
            .andExpect(jsonPath("$.totalAmount").value("39.80"))
            .andExpect(jsonPath("$.shippingAddress.postalCode").value("560001"))
            .andExpect(jsonPath("$.items[0].productId").value(101))
            .andExpect(jsonPath("$.items[0].quantity").value(2))
            .andExpect(jsonPath("$.items[0].unitPrice").value("19.90"))
            .andExpect(jsonPath("$.createdAt").value("2026-11-17T12:34:56.123456Z"));

        verify(orderService).checkout(new io.shopverse.order.dto.CheckoutRequest(
                List.of(new io.shopverse.order.dto.CheckoutItemRequest(101L, 2)),
                new io.shopverse.order.dto.ShippingAddressRequest("Test Customer", "+919876543210",
                    "12 Test Road", "Unit 4", "Bengaluru", "Karnataka", "560001", "IN")),
            "alice", null, "checkout-test");
    }

    @Test
    void validReviewMapsRequestAndReturnsSummaryWithoutIdempotencyHeader() throws Exception {
        var review = new CheckoutReviewResponse(
            List.of(new OrderItemResponse(101L, "Test Product", 2, new BigDecimal("19.90"))),
            new ShippingAddressResponse("Test Customer", "+919876543210", "12 Test Road",
                "Unit 4", "Bengaluru", "Karnataka", "560001", "IN"),
            new BigDecimal("39.80"), "INR");
        given(orderService.reviewCheckout(any())).willReturn(review);

        mvc.perform(post("/api/v1/orders/checkout/review")
                .principal(new UsernamePasswordAuthenticationToken("alice", "unused", List.of()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(validBody()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].productId").value(101))
            .andExpect(jsonPath("$.items[0].quantity").value(2))
            .andExpect(jsonPath("$.totalAmount").value("39.80"))
            .andExpect(jsonPath("$.currency").value("INR"))
            .andExpect(jsonPath("$.shippingAddress.postalCode").value("560001"));

        verify(orderService).reviewCheckout(new io.shopverse.order.dto.CheckoutRequest(
            List.of(new io.shopverse.order.dto.CheckoutItemRequest(101L, 2)),
            new io.shopverse.order.dto.ShippingAddressRequest("Test Customer", "+919876543210",
                "12 Test Road", "Unit 4", "Bengaluru", "Karnataka", "560001", "IN")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "[]", "[{\"productId\":101,\"quantity\":0}]", "[{\"quantity\":1}]"})
    void invalidReviewItemsAreRejectedBeforeCallingService(String items) throws Exception {
        mvc.perform(post("/api/v1/orders/checkout/review")
                .principal(new UsernamePasswordAuthenticationToken("alice", "unused", List.of()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body(items, ADDRESS)))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @Test
    void missingIdempotencyHeaderIsRejectedBeforeCallingService() throws Exception {
        mvc.perform(checkout(validBody())).andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void blankIdempotencyHeaderIsRejectedBeforeCallingService(String key) throws Exception {
        mvc.perform(checkout(validBody()).header("Idempotency-Key", key))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @Test
    void oversizedIdempotencyHeaderIsRejectedBeforeCallingService() throws Exception {
        mvc.perform(checkout(validBody()).header("Idempotency-Key", "k".repeat(101)))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "[]", "[{\"productId\":101,\"quantity\":1},{\"productId\":102,\"quantity\":1}]",
        "[{\"productId\":101,\"quantity\":0}]", "[{\"quantity\":1}]"})
    void invalidItemsAreRejectedBeforeCallingService(String items) throws Exception {
        mvc.perform(checkout(body(items, ADDRESS)).header("Idempotency-Key", "checkout-test"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "{}", "{\"recipientName\":\"   \"}"})
    void invalidAddressIsRejectedBeforeCallingService(String address) throws Exception {
        mvc.perform(checkout(body("[{\"productId\":101,\"quantity\":1}]", address))
                .header("Idempotency-Key", "checkout-test"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @Test
    void blankNestedRecipientIsRejectedBeforeCallingService() throws Exception {
        mvc.perform(checkout(body("[{\"productId\":101,\"quantity\":1}]",
                ADDRESS.replace("Test Customer", "   ")))
                .header("Idempotency-Key", "checkout-test"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    @Test
    void invalidNestedPhoneIsRejectedBeforeCallingService() throws Exception {
        mvc.perform(checkout(body("[{\"productId\":101,\"quantity\":1}]",
                ADDRESS.replace("+919876543210", "invalid")))
                .header("Idempotency-Key", "checkout-test"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(orderService);
    }

    private MockHttpServletRequestBuilder checkout(String body) {
        return post("/api/v1/orders/checkout")
            .principal(new UsernamePasswordAuthenticationToken("alice", "unused", List.of()))
            .contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private String validBody() {
        return body("[{\"productId\":101,\"quantity\":2}]", ADDRESS);
    }

    private String body(String items, String address) {
        return "{\"items\":" + items + ",\"shippingAddress\":" + address + "}";
    }

    @Configuration
    @EnableWebMvc
    @Import({OrderController.class, OrderContractMapperImpl.class, ApiExceptionHandler.class})
    static class TestConfig {
        @Bean
        static MethodValidationPostProcessor methodValidationPostProcessor() {
            return new MethodValidationPostProcessor();
        }
    }
}
