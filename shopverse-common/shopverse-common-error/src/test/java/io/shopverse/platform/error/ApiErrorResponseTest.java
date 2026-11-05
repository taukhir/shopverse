package io.shopverse.platform.error;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ApiErrorResponseTest {

    @Test
    void errorsAreAnImmutableSnapshotAndPreserveNullableValues() {
        var errors = new LinkedHashMap<String, String>();
        errors.put("field", "required");
        errors.put("optional", null);
        var response = new ApiErrorResponse(400, "Invalid request", LocalDateTime.now(), errors);

        errors.put("field", "changed");

        assertThat(response.errors()).containsEntry("field", "required").containsEntry("optional", null);
        assertThatThrownBy(() -> response.errors().put("another", "value"))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void absentErrorsRemainAbsent() {
        var response = new ApiErrorResponse(500, "Failure", LocalDateTime.now(), null);

        assertThat(response.errors()).isNull();
    }
}
