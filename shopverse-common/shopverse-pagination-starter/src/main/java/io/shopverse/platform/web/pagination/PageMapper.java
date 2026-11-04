package io.shopverse.platform.web.pagination;

import org.springframework.data.domain.Page;

import java.util.function.Function;

public final class PageMapper {

    private PageMapper() {
    }

    public static <S, T> PageResponse<T> toResponse(Page<S> page, Function<S, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
