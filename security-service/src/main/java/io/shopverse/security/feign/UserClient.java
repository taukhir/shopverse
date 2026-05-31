package io.shopverse.security.feign;

import io.shopverse.security.model.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "USER-SERVICE")
public interface UserClient {

    @GetMapping("/api/v1/internal/users/username/{username}")
    User loadByUsername(@PathVariable String username);
}
