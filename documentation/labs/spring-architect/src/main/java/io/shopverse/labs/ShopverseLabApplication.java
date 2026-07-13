package io.shopverse.labs;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class ShopverseLabApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopverseLabApplication.class, args);
    }
}
