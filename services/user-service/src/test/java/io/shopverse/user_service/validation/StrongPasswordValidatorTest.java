package io.shopverse.user_service.validation;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StrongPasswordValidatorTest {

    private final StrongPasswordValidator validator = new StrongPasswordValidator();

    @Test
    void isValidAcceptsStrongPassword() {
        assertThat(validator.isValid("Strong@123", null)).isTrue();
    }

    @Test
    void isValidRejectsWeakPasswords() {
        assertThat(validator.isValid("password", null)).isFalse();
        assertThat(validator.isValid("PASSWORD123", null)).isFalse();
        assertThat(validator.isValid("Password", null)).isFalse();
        assertThat(validator.isValid("Password123", null)).isFalse();
    }

    @Test
    void isValidAllowsNullForOptionalFields() {
        assertThat(validator.isValid(null, null)).isTrue();
    }
}
