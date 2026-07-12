package io.shopverse.user_service.constants;

/**
 * Centralizes externally visible API paths and messages so controllers,
 * filters, and tests do not duplicate string literals.
 */
public final class ApiConstants {

    public static final String API_V1 = "/api/v1";

    public static final String PUBLIC_API = API_V1 + "/public";
    public static final String USERS = API_V1 + "/users";
    public static final String CART = API_V1 + "/cart";
    public static final String INTERNAL_USERS = API_V1 + "/internal/users";
    public static final String ROLES = API_V1 + "/roles";
    public static final String PERMISSIONS = API_V1 + "/permissions";

    public static final String SWAGGER = "/swagger-ui/**";
    public static final String SWAGGER_HTML = "/swagger-ui.html";
    public static final String OPEN_API = "/v3/api-docs/**";
    public static final String TOO_MANY_REQUESTS_MESSAGE = "Too many requests. Please retry later";
    public static final String SERVICE_BUSY_MESSAGE = "Service is busy. Please retry later";

    private ApiConstants() {
    }
}
