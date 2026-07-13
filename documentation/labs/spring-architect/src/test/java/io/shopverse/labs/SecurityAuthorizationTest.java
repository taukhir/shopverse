package io.shopverse.labs;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "labs.security.enabled=true")
class SecurityAuthorizationTest {
    @Autowired MockMvc mvc;
    @MockitoBean JwtDecoder jwtDecoder;

    @Test
    void anonymousAndWrongOwnerAreDeniedWhileOwnerIsAllowed() throws Exception {
        mvc.perform(get("/api/orders/17").param("customerId", "customer-7"))
                .andExpect(status().isUnauthorized());

        mvc.perform(get("/api/orders/17").param("customerId", "customer-7")
                        .with(jwt().jwt(token -> token.subject("customer-8"))
                                .authorities(new SimpleGrantedAuthority("SCOPE_orders.read"))))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/orders/17").param("customerId", "customer-7")
                        .with(jwt().jwt(token -> token.subject("customer-7"))
                                .authorities(new SimpleGrantedAuthority("SCOPE_orders.read"))))
                .andExpect(status().isOk());
    }
}
