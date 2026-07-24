package io.shopverse.labs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

@EnableCaching
@EnableJpaAuditing
@SpringBootApplication
public class ShopverseLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopverseLabApplication.class, args);
    }

    @Bean
    AuditorAware<String> labAuditor() {
        return () -> Optional.of("spring-data-lab");
    }
}
