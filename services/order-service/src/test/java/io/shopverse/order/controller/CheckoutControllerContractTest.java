package io.shopverse.order.controller;

import io.shopverse.order.dto.CheckoutResponse;
import io.shopverse.order.dto.OrderItemResponse;
import io.shopverse.order.dto.OrderResponse;
import io.shopverse.order.dto.ShippingAddressResponse;
import io.shopverse.order.exception.ApiExceptionHandler;
import io.shopverse.order.service.CheckoutService;
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
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises MVC binding, validation and the real mapper; security has separate authorization tests.
 */
@SpringJUnitConfig(CheckoutControllerContractTest.TestConfig.class)
@WebAppConfiguration
class CheckoutControllerContractTest {

    private static final String ADDRESS = """
        {"recipientName":"Test Customer","phoneNumber":"+919876543210",
         "line1":"12 Test Road","line2":"Unit 4","city":"Bengaluru",
         "state":"Karnataka","postalCode":"560001","country":"IN"}
        """;

    @Autowired
    private WebApplicationContext context;
    @MockitoBean
    private CheckoutService checkoutService;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void validCreateCheckoutMapsRequestAndReturnsCreatedContract() throws Exception {
        var response = new CheckoutResponse("CHK-TEST", 1L, "READY_TO_PLACE",
            List.of(new OrderItemResponse(101L, "Test Product", 2, new BigDecimal("19.90"))),
            new ShippingAddressResponse("Test Customer", "+919876543210", "12 Test Road",
                "Unit 4", "Bengaluru", "Karnataka", "560001", "IN"),
            "INR", new BigDecimal("39.80"),
            Instant.parse("2026-11-17T12:34:56.123456Z"), null);
        given(checkoutService.createCheckout(any(), eq("alice"))).willReturn(response);

        mvc.perform(createCheckout(validBody()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.checkoutId").value("CHK-TEST"))
            .andExpect(jsonPath("$.version").value(1))
            .andExpect(jsonPath("$.status").value("READY_TO_PLACE"))
            .andExpect(jsonPath("$.currency").value("INR"))
            .andExpect(jsonPath("$.totalAmount").value("39.80"))
            .andExpect(jsonPath("$.shippingAddress.postalCode").value("560001"))
            .andExpect(jsonPath("$.items[0].productId").value(101))
            .andExpect(jsonPath("$.items[0].quantity").value(2))
            .andExpect(jsonPath("$.orderId").value(org.hamcrest.Matchers.nullValue()));

        verify(checkoutService).createCheckout(new io.shopverse.order.dto.CheckoutRequest(
                List.of(new io.shopverse.order.dto.CheckoutItemRequest(101L, 2)),
                new io.shopverse.order.dto.ShippingAddressRequest("Test Customer", "+919876543210",
                    "12 Test Road", "Unit 4", "Bengaluru", "Karnataka", "560001", "IN")),
            "alice");
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "[]", "[{\"productId\":101,\"quantity\":1},{\"productId\":102,\"quantity\":1}]",
        "[{\"productId\":101,\"quantity\":0}]", "[{\"quantity\":1}]"})
    void invalidItemsAreRejectedBeforeCallingService(String items) throws Exception {
        mvc.perform(createCheckout(body(items, ADDRESS)))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(checkoutService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "{}", "{\"recipientName\":\"   \"}"})
    void invalidAddressIsRejectedBeforeCallingService(String address) throws Exception {
        mvc.perform(createCheckout(body("[{\"productId\":101,\"quantity\":1}]", address)))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(checkoutService);
    }

    @Test
    void validPlaceOrderMapsRequestAndReturnsCreatedContract() throws Exception {
        var response = new OrderResponse(7L, "ORD-TEST", "corr-test", "place-test", "alice",
            "PENDING_INVENTORY", "INR", new BigDecimal("39.80"), null, List.of(),
            Instant.parse("2026-11-17T12:34:56.123456Z"));
        given(checkoutService.placeOrder(eq("CHK-TEST"), any(), eq("alice"), any(), eq("place-test")))
            .willReturn(response);

        mvc.perform(placeOrder("CHK-TEST", "{\"checkoutVersion\":1}")
                .header("Idempotency-Key", "place-test"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.orderNumber").value("ORD-TEST"));

        verify(checkoutService).placeOrder(eq("CHK-TEST"),
            eq(new io.shopverse.order.dto.PlaceOrderRequest(1L)), eq("alice"), any(), eq("place-test"));
    }

    @Test
    void missingIdempotencyHeaderIsRejectedBeforeCallingService() throws Exception {
        mvc.perform(placeOrder("CHK-TEST", "{\"checkoutVersion\":1}")).andExpect(status().isBadRequest());
        verifyNoInteractions(checkoutService);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "{\"checkoutVersion\":0}", "{\"checkoutVersion\":null}"})
    void invalidCheckoutVersionIsRejectedBeforeCallingService(String body) throws Exception {
        mvc.perform(placeOrder("CHK-TEST", body).header("Idempotency-Key", "place-test"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(checkoutService);
    }

    private MockHttpServletRequestBuilder createCheckout(String body) {
        return post("/api/v1/checkouts")
            .principal(new UsernamePasswordAuthenticationToken("alice", "unused", List.of()))
            .contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private MockHttpServletRequestBuilder placeOrder(String checkoutId, String body) {
        return post("/api/v1/checkouts/" + checkoutId + "/place-order")
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
    @Import({CheckoutController.class, OrderContractMapperImpl.class, ApiExceptionHandler.class})
    static class TestConfig {
        @Bean
        static MethodValidationPostProcessor methodValidationPostProcessor() {
            return new MethodValidationPostProcessor();
        }
    }
}
