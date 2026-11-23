package io.shopverse.user_service.controller.admin;

import io.shopverse.user_service.dto.UserGroupResponse;
import io.shopverse.user_service.service.UserGroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Set;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserGroupControllerTest {
    private MockMvc mockMvc;

    @Mock
    private UserGroupService groupService;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new UserGroupController(groupService)).build();
    }

    @Test
    void getGroupDelegatesToService() throws Exception {
        when(groupService.getGroup(7L)).thenReturn(new UserGroupResponse(7L, "support", "Support team", 0, Set.of()));
        mockMvc.perform(get("/api/v1/groups/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groupName").value("support"));
        verify(groupService).getGroup(7L);
    }

    @Test
    void memberAssignmentUsesIdempotentNoContentResponse() throws Exception {
        mockMvc.perform(put("/api/v1/groups/7/members/12"))
                .andExpect(status().isNoContent());
        verify(groupService).addMember(7L, 12L);
    }
}
