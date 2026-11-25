package io.shopverse.user_service.service.identity;

import io.shopverse.user_service.dto.UserResponse;
import io.shopverse.user_service.entities.User;
import io.shopverse.user_service.exceptions.ResourceNotFoundException;
import io.shopverse.user_service.mapper.UserMapper;
import io.shopverse.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserIdentityServiceImpl implements UserIdentityService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getByUsername(String username) {
        log.info("Loading user identity by username");
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return UserMapper.toUserResponse(user);
    }
}
