package io.shopverse.auth.feign;

import io.shopverse.auth.model.User;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "USER-SERVICE")
public interface UserClient {

    @GetMapping("/api/v1/internal/users/authenticated")
    User loadAuthenticatedUser(@RequestHeader("Authorization") String authorization);
}
