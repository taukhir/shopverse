package io.shopverse.user_service.model;

import io.shopverse.user_service.entities.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;

import java.util.Set;

public record ReplaceUserRequest(@NotBlank @Pattern(regexp = "^[a-zA-Z0-9._-]{3,50}$") String username,
                                 @NotBlank @Email String email, String firstName, String lastName,
                                 @Pattern(regexp = "^$|^[+]?[0-9]{10,15}$") String phoneNumber,
                                 @NotBlank UserStatus status, boolean enabled, boolean accountNonLocked,
                                 Set<String> roles) { }
