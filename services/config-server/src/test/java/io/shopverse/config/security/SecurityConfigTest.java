package io.shopverse.config.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.security.user.name=test-config-client",
        "spring.security.user.password=test-config-password"
})
class SecurityConfigTest {

    @Autowired private WebApplicationContext context;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void actuatorHealthIsReachableWithoutCredentials() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void configEndpointWithoutCredentialsIsRejected() throws Exception {
        mockMvc.perform(get("/CONFIG-SERVER/native"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void configEndpointWithWrongCredentialsIsRejected() throws Exception {
        mockMvc.perform(get("/CONFIG-SERVER/native")
                        .with(SecurityMockMvcRequestPostProcessors.httpBasic("test-config-client", "wrong-password")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void configEndpointWithValidCredentialsIsReachable() throws Exception {
        mockMvc.perform(get("/CONFIG-SERVER/native")
                        .with(SecurityMockMvcRequestPostProcessors.httpBasic("test-config-client", "test-config-password")))
                .andExpect(status().isOk());
    }
}
