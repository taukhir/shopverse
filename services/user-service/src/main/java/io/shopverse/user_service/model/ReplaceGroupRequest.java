package io.shopverse.user_service.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record ReplaceGroupRequest(@NotBlank @Size(max = 80) String groupName, @Size(max = 500) String description, Set<Long> roleIds) { }
