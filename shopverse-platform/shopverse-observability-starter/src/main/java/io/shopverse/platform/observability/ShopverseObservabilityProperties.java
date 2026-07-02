package io.shopverse.platform.observability;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.env.Environment;

@ConfigurationProperties(prefix = "shopverse.observability")
public class ShopverseObservabilityProperties {

    private final RequestLogging requestLogging = new RequestLogging();

    public RequestLogging getRequestLogging() {
        return requestLogging;
    }

    public static class RequestLogging {
        private boolean enabled = true;
        private String serviceName;
        private String metricName = "shopverse.service.requests.logged";
        private String actuatorPathPrefix = "/actuator/";

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public String getServiceName() {
            return serviceName;
        }

        public void setServiceName(String serviceName) {
            this.serviceName = serviceName;
        }

        public String getMetricName() {
            return metricName;
        }

        public void setMetricName(String metricName) {
            this.metricName = metricName;
        }

        public String getActuatorPathPrefix() {
            return actuatorPathPrefix;
        }

        public void setActuatorPathPrefix(String actuatorPathPrefix) {
            this.actuatorPathPrefix = actuatorPathPrefix;
        }

        String resolvedServiceName(Environment environment) {
            if (serviceName != null && !serviceName.isBlank()) {
                return serviceName;
            }
            return environment.getProperty("spring.application.name", "UNKNOWN-SERVICE");
        }
    }
}
