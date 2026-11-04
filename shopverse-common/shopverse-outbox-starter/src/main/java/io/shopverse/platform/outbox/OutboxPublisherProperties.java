package io.shopverse.platform.outbox;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "shopverse.outbox")
public class OutboxPublisherProperties {

    private int batchSize = 50;
    private long claimTimeoutMs = 30_000;
    private long sendTimeoutSeconds = 10;

    public int getBatchSize() {
        return batchSize;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    public Duration getClaimTimeout() {
        return Duration.ofMillis(claimTimeoutMs);
    }

    public void setClaimTimeout(Duration claimTimeout) {
        this.claimTimeoutMs = claimTimeout.toMillis();
    }

    public Duration getSendTimeout() {
        return Duration.ofSeconds(sendTimeoutSeconds);
    }

    public void setSendTimeout(Duration sendTimeout) {
        this.sendTimeoutSeconds = sendTimeout.toSeconds();
    }

    public long getClaimTimeoutMs() {
        return claimTimeoutMs;
    }

    public void setClaimTimeoutMs(long claimTimeoutMs) {
        this.claimTimeoutMs = claimTimeoutMs;
    }

    public long getSendTimeoutSeconds() {
        return sendTimeoutSeconds;
    }

    public void setSendTimeoutSeconds(long sendTimeoutSeconds) {
        this.sendTimeoutSeconds = sendTimeoutSeconds;
    }
}
