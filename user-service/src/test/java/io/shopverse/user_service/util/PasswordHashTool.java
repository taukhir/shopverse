package io.shopverse.user_service.util;

import org.springframework.security.crypto.factory.PasswordEncoderFactories;

/**
 * Command-line development utility invoked by the generatePasswordHash task.
 * It is under test sources and is therefore excluded from the application JAR.
 */
public final class PasswordHashTool {

    private PasswordHashTool() {
    }

    public static void main(String[] args) {
        String password = System.getenv("SHOPVERSE_HASH_PASSWORD");
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException(
                    "Set SHOPVERSE_HASH_PASSWORD to a non-blank development password"
            );
        }

        String hash = PasswordEncoderFactories
                .createDelegatingPasswordEncoder()
                .encode(password);
        System.out.println(hash);
    }
}
