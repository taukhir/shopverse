package io.shopverse.user_service.util;

import io.shopverse.user_service.exceptions.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

public final class PaginationUtils {

    private static final int MAX_PAGE_SIZE = 100;

    private PaginationUtils() {
    }

    public static Pageable createPageable(
            int page,
            int size,
            String sortBy,
            String direction,
            Set<String> allowedSortFields
    ) {
        if (page < 0) {
            throw new BadRequestException("Page number must be zero or greater");
        }

        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }

        if (!allowedSortFields.contains(sortBy)) {
            throw new BadRequestException("Sorting is not supported by field: " + sortBy);
        }

        Sort.Direction sortDirection = Sort.Direction.fromOptionalString(direction)
                .orElseThrow(() -> new BadRequestException("Sort direction must be ASC or DESC"));

        return PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
    }
}
