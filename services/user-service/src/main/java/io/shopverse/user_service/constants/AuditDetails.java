package io.shopverse.user_service.constants;

/**
 * Human-readable audit details stored with audit actions.
 */
public final class AuditDetails {

    public static final String USER_ACCOUNT_CREATED = "User account created";
    public static final String USER_ACCOUNT_UPDATED = "User account updated";
    public static final String USER_ACCOUNT_SOFT_DELETED = "User account soft deleted";
    public static final String USER_PASSWORD_CHANGED = "User password changed";
    public static final String USER_PASSWORD_RESET_BY_ADMIN = "User password reset by administrator";

    private AuditDetails() {
    }
}
