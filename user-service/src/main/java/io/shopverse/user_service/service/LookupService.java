package io.shopverse.user_service.service;

import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;

public interface LookupService {

    Role findRoleByName(String roleName);

    Permission findPermissionByName(String permissionName);
}
