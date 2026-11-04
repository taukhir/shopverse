package io.shopverse.auth.service;

import io.shopverse.auth.feign.UserClient;
import io.shopverse.auth.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class UserServiceClient {

    private static final String BASIC_AUTH_PREFIX = "Basic ";
    private static final String BASIC_AUTH_SEPARATOR = ":";

    private final UserClient userClient;

    public User authenticate(String username, String password) {
        return userClient.loadAuthenticatedUser(basicAuth(username, password));
    }

    private String basicAuth(String username, String password) {
        String credentials = username + BASIC_AUTH_SEPARATOR + password;
        String encodedCredentials = Base64.getEncoder()
                .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        return BASIC_AUTH_PREFIX + encodedCredentials;
    }
}
