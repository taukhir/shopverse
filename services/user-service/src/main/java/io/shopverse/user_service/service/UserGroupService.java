package io.shopverse.user_service.service;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.user_service.dto.UserGroupResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.model.CreateGroupRequest;
import io.shopverse.user_service.model.UpdateGroupRequest;
import io.shopverse.user_service.model.ReplaceGroupRequest;
import org.springframework.data.domain.Pageable;

public interface UserGroupService {
    PageResponse<UserGroupResponse> getGroups(String search, Pageable pageable);
    UserGroupResponse getGroup(Long id);
    UserGroupResponse createGroup(CreateGroupRequest request);
    UserGroupResponse updateGroup(Long id, UpdateGroupRequest request);
    UserGroupResponse replaceGroup(Long id, ReplaceGroupRequest request);
    void deleteGroup(Long id);
    PageResponse<UserSummaryResponse> getMembers(Long groupId, Pageable pageable);
    UserGroupResponse addMember(Long groupId, Long userId);
    UserGroupResponse removeMember(Long groupId, Long userId);
    UserGroupResponse addRole(Long groupId, Long roleId);
    UserGroupResponse removeRole(Long groupId, Long roleId);
}
