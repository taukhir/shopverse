package io.shopverse.platform.web.pagination;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PageResponseTest {

    @Test
    void contentIsAnImmutableSnapshotIncludingNullableElements() {
        var content = new ArrayList<String>();
        content.add("original");
        content.add(null);
        var response = new PageResponse<>(content, 0, 2, 2, 1, true, true);

        content.clear();

        assertThat(response.content()).containsExactly("original", null);
        assertThatThrownBy(() -> response.content().add("changed"))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void absentContentRemainsAbsent() {
        var response = new PageResponse<String>(null, 0, 0, 0, 0, true, true);

        assertThat(response.content()).isNull();
    }
}
