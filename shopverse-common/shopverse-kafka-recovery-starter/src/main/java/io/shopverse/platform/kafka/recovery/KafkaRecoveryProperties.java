package io.shopverse.platform.kafka.recovery;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "shopverse.kafka-recovery")
public class KafkaRecoveryProperties {

    private String serviceName = "unknown";
    private String replayMetricName = "shopverse.kafka.dlt.replays";
    private String failedMetricName = "shopverse.kafka.dlt.events";

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getReplayMetricName() {
        return replayMetricName;
    }

    public void setReplayMetricName(String replayMetricName) {
        this.replayMetricName = replayMetricName;
    }

    public String getFailedMetricName() {
        return failedMetricName;
    }

    public void setFailedMetricName(String failedMetricName) {
        this.failedMetricName = failedMetricName;
    }
}
