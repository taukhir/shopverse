package io.shopverse.platform.observability;

import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.Filter;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.web.filter.OncePerRequestFilter;

@AutoConfiguration
@ConditionalOnClass({Filter.class, OncePerRequestFilter.class, MeterRegistry.class})
@EnableConfigurationProperties(ShopverseObservabilityProperties.class)
public class ShopverseObservabilityAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(ShopverseRequestLoggingFilter.class)
    @ConditionalOnProperty(
            prefix = "shopverse.observability.request-logging",
            name = "enabled",
            havingValue = "true",
            matchIfMissing = true
    )
    ShopverseRequestLoggingFilter shopverseRequestLoggingFilter(
            MeterRegistry meterRegistry,
            ShopverseObservabilityProperties properties,
            Environment environment
    ) {
        ShopverseObservabilityProperties.RequestLogging requestLogging = properties.getRequestLogging();
        return new ShopverseRequestLoggingFilter(
                meterRegistry,
                requestLogging.resolvedServiceName(environment),
                requestLogging.getMetricName(),
                requestLogging.getActuatorPathPrefix()
        );
    }

    @Bean
    @ConditionalOnBean(ShopverseRequestLoggingFilter.class)
    @ConditionalOnMissingBean(name = "shopverseRequestLoggingFilterRegistration")
    FilterRegistrationBean<ShopverseRequestLoggingFilter> shopverseRequestLoggingFilterRegistration(
            ShopverseRequestLoggingFilter filter
    ) {
        FilterRegistrationBean<ShopverseRequestLoggingFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE + 20);
        registration.setName("shopverseRequestLoggingFilter");
        return registration;
    }
}
