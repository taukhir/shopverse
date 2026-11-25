package io.shopverse.user_service.controller.account;

import io.shopverse.user_service.service.address.UserAddressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.security.Principal;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserAddressControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserAddressService userAddressService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new UserAddressController(userAddressService)).build();
    }

    @Test
    void getAddressesUsesAuthenticatedUsernameAndKeepsExistingRoute() throws Exception {
        when(userAddressService.getAddresses("ahmed")).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/users/me/addresses").principal((Principal) () -> "ahmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(userAddressService).getAddresses("ahmed");
    }

    @Test
    void getAddressUsesCanonicalCurrentAccountRouteAndAuthenticatedOwner() throws Exception {
        when(userAddressService.getAddress("ahmed", 42L)).thenReturn(Optional.of(new io.shopverse.user_service.dto.UserAddressResponse(
                42L, "Home", "Ahmed", null, "Street 1", null, "Bengaluru", "KA", "560001", "India", true, null, null)));
        mockMvc.perform(get("/api/v1/accounts/current/addresses/42").principal((Principal) () -> "ahmed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(42));
        verify(userAddressService).getAddress("ahmed", 42L);
    }
}
