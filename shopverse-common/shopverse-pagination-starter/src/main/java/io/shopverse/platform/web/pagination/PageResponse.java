package io.shopverse.platform.web.pagination;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public PageResponse {
        content = content == null ? null : Collections.unmodifiableList(new ArrayList<>(content));
    }
}
