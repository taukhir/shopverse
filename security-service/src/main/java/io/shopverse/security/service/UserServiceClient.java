package io.shopverse.security.service;

import io.shopverse.security.feign.UserClient;
import io.shopverse.security.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceClient {

    private final UserClient userClient;

    public User loadByUsername(String username) {

        return userClient.loadByUsername(username);
    }

}