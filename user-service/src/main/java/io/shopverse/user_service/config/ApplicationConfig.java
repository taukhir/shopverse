package io.shopverse.user_service.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(UserServiceProperties.class)
public class ApplicationConfig {
}
