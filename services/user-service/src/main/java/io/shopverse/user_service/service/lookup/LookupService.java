package io.shopverse.user_service.service.lookup;

import io.shopverse.user_service.entities.Permission;
import io.shopverse.user_service.entities.Role;

public interface LookupService {

    Role findRoleByName(String roleName);

    Permission findPermissionByName(String permissionName);
}
