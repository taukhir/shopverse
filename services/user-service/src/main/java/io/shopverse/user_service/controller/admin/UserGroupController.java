package io.shopverse.user_service.controller.admin;

import io.shopverse.platform.web.pagination.PageResponse;
import io.shopverse.platform.web.pagination.PaginationUtils;
import io.shopverse.user_service.constants.ApiConstants;
import io.shopverse.user_service.dto.ApiResponse;
import io.shopverse.user_service.dto.UserGroupResponse;
import io.shopverse.user_service.dto.UserSummaryResponse;
import io.shopverse.user_service.model.CreateGroupRequest;
import io.shopverse.user_service.model.UpdateGroupRequest;
import io.shopverse.user_service.model.ReplaceGroupRequest;
import io.shopverse.user_service.service.UserGroupService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping(ApiConstants.GROUPS)
@RequiredArgsConstructor
@Tag(name = "Groups", description = "Administrative group and membership management APIs")
@PreAuthorize("hasAuthority('ADMIN_ACCESS')")
public class UserGroupController {
    private final UserGroupService groupService;

    @GetMapping
    public ResponseEntity<PageResponse<UserGroupResponse>> getGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction,
            @RequestParam(required = false) String search) {
        Pageable pageable = PaginationUtils.createPageable(page, size, sortBy, direction, Set.of("id", "groupName", "createdAt"));
        return ResponseEntity.ok(groupService.getGroups(search, pageable));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<UserGroupResponse>> getGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(ApiResponse.success("Group fetched successfully", groupService.getGroup(groupId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserGroupResponse>> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        UserGroupResponse created = groupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .location(org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentRequest()
                        .path("/{groupId}").buildAndExpand(created.id()).toUri())
                .body(ApiResponse.success("Group created successfully", created));
    }

    @PatchMapping("/{groupId}")
    public ResponseEntity<ApiResponse<UserGroupResponse>> updateGroup(@PathVariable Long groupId, @Valid @RequestBody UpdateGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Group updated successfully", groupService.updateGroup(groupId, request)));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<ApiResponse<UserGroupResponse>> replaceGroup(@PathVariable Long groupId, @Valid @RequestBody ReplaceGroupRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Group replaced successfully", groupService.replaceGroup(groupId, request)));
    }

    @DeleteMapping("/{groupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@PathVariable Long groupId) { groupService.deleteGroup(groupId); }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<PageResponse<UserSummaryResponse>> getMembers(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PaginationUtils.createPageable(page, size, "id", "ASC", Set.of("id", "username", "email", "createdAt"));
        return ResponseEntity.ok(groupService.getMembers(groupId, pageable));
    }

    @PutMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> addMember(@PathVariable Long groupId, @PathVariable Long userId) {
        groupService.addMember(groupId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable Long groupId, @PathVariable Long userId) {
        groupService.removeMember(groupId, userId);
    }

    @PutMapping("/{groupId}/roles/{roleId}")
    public ResponseEntity<Void> addRole(@PathVariable Long groupId, @PathVariable Long roleId) {
        groupService.addRole(groupId, roleId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/roles/{roleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRole(@PathVariable Long groupId, @PathVariable Long roleId) {
        groupService.removeRole(groupId, roleId);
    }
}
