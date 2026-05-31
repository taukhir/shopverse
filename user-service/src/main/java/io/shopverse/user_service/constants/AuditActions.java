package io.shopverse.user_service.constants;

/**
 * Audit action names persisted in the user_audit table.
 */
public final class AuditActions {

    public static final String USER_CREATED = "USER_CREATED";
    public static final String USER_UPDATED = "USER_UPDATED";
    public static final String USER_DELETED = "USER_DELETED";
    public static final String PASSWORD_CHANGED = "PASSWORD_CHANGED";
    public static final String PASSWORD_RESET = "PASSWORD_RESET";

    private AuditActions() {
    }
}
