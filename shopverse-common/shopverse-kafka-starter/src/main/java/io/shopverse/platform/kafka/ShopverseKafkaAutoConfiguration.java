package io.shopverse.platform.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;

@AutoConfiguration
@ConditionalOnClass(ObjectMapper.class)
public class ShopverseKafkaAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    KafkaEventParser kafkaEventParser(ObjectMapper objectMapper) {
        return new KafkaEventParser(objectMapper);
    }
}
