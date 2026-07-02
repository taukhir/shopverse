package io.shopverse.platform.web.pagination;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PaginationUtilsTest {

    @Test
    void createPageableReturnsValidatedPageable() {
        Pageable pageable = PaginationUtils.createPageable(
                1,
                25,
                "username",
                "DESC",
                Set.of("id", "username")
        );

        assertThat(pageable.getPageNumber()).isEqualTo(1);
        assertThat(pageable.getPageSize()).isEqualTo(25);
        assertThat(pageable.getSort().getOrderFor("username").getDirection())
                .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void createPageableRejectsNegativePage() {
        assertThatThrownBy(() -> PaginationUtils.createPageable(
                -1,
                20,
                "id",
                "ASC",
                Set.of("id")
        ))
                .isInstanceOf(InvalidPageRequestException.class)
                .hasMessage("Page number must be zero or greater");
    }

    @Test
    void createPageableRejectsUnsupportedSortField() {
        assertThatThrownBy(() -> PaginationUtils.createPageable(
                0,
                20,
                "password",
                "ASC",
                Set.of("id", "username")
        ))
                .isInstanceOf(InvalidPageRequestException.class)
                .hasMessage("Sorting is not supported by field: password");
    }

    @Test
    void createPageableRejectsInvalidDirection() {
        assertThatThrownBy(() -> PaginationUtils.createPageable(
                0,
                20,
                "id",
                "SIDEWAYS",
                Set.of("id")
        ))
                .isInstanceOf(InvalidPageRequestException.class)
                .hasMessage("Sort direction must be ASC or DESC");
    }
}
