package io.shopverse.discovery.security;

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
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false",
        "spring.cloud.config.enabled=false",
        "spring.security.user.name=test-eureka-client",
        "spring.security.user.password=test-eureka-password"
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
    void apiHealthIsReachableWithoutCredentials() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void eurekaRegistryWithoutCredentialsIsRejected() throws Exception {
        mockMvc.perform(get("/eureka/apps"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void eurekaRegistryWithWrongCredentialsIsRejected() throws Exception {
        mockMvc.perform(get("/eureka/apps")
                        .with(SecurityMockMvcRequestPostProcessors.httpBasic("test-eureka-client", "wrong-password")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void eurekaRegistryWithValidCredentialsPassesAuthentication() throws Exception {
        // Eureka's own REST resources run outside the Spring MVC dispatcher this test
        // exercises, so this only proves Spring Security let the request through
        // (anything other than 401/403), not that the Eureka resource itself responded.
        int status = mockMvc.perform(get("/eureka/apps")
                        .with(SecurityMockMvcRequestPostProcessors.httpBasic("test-eureka-client", "test-eureka-password")))
                .andReturn().getResponse().getStatus();

        org.assertj.core.api.Assertions.assertThat(status).isNotIn(401, 403);
    }
}
