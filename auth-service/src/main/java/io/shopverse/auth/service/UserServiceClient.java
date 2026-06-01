package io.shopverse.auth.service;

import io.shopverse.auth.feign.UserClient;
import io.shopverse.auth.model.User;
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