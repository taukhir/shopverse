package io.shopverse.user_service.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String ROLES_BY_NAME = "rolesByName";
    public static final String PERMISSIONS_BY_NAME = "permissionsByName";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(ROLES_BY_NAME, PERMISSIONS_BY_NAME);
    }
}
