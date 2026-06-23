package io.shopverse.inventory_service;

import io.shopverse.inventory_service.outbox.OutboxService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true, parallel = true)
@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "eureka.client.enabled=false",
        "spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.yml",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.kafka.listener.auto-startup=false",
        "shopverse.outbox.publish-delay-ms=3600000",
        "shopverse.inventory.reservation-ttl=5m",
        "shopverse.inventory.expiry-scan-delay-ms=3600000",
        "shopverse.kafka.topics.order-created=shopverse.order.created",
        "shopverse.kafka.topics.inventory-reserved=shopverse.inventory.reserved",
        "shopverse.kafka.topics.inventory-failed=shopverse.inventory.failed",
        "shopverse.kafka.topics.payment-completed=shopverse.payment.completed",
        "shopverse.kafka.topics.payment-failed=shopverse.payment.failed",
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=http://localhost:65535/jwks",
        "security.jwt.issuer=shopverse-auth-service"
})
class InventoryInfrastructureIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("inventory_service")
            .withUsername("shopverse")
            .withPassword("shopverse")
            .withStartupTimeout(Duration.ofMinutes(2));

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer("apache/kafka-native:3.9.1")
            .withStartupTimeout(Duration.ofMinutes(2));

    @DynamicPropertySource
    static void infrastructureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }

    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired OutboxService outboxService;
    @Autowired TransactionTemplate transactionTemplate;
    @Autowired KafkaTemplate<String, String> kafkaTemplate;

    @Test
    void migrationsCreateInventoryAndRecoveryTables() {
        assertThat(tableExists("inventory_items")).isTrue();
        assertThat(tableExists("inventory_reservations")).isTrue();
        assertThat(tableExists("outbox_events")).isTrue();
        assertThat(tableExists("failed_kafka_events")).isTrue();
        assertThat(columnExists("outbox_events", "claimed_at")).isTrue();
    }

    @Test
    void migrationsSeedCatalogAndReservationHistory() {
        assertThat(count("select count(*) from inventory_items where product_id between 101 and 110"))
                .isEqualTo(10);
        assertThat(count("select count(*) from inventory_reservations where order_number like 'DEMO-ORD-%'"))
                .isEqualTo(5);
        assertThat(jdbcTemplate.queryForObject(
                "select status from inventory_reservations where order_number = 'DEMO-ORD-1004'",
                String.class
        )).isEqualTo("RESERVED");
        assertThat(jdbcTemplate.queryForObject(
                "select reserved_quantity from inventory_items where product_id = 104",
                Integer.class
        )).isEqualTo(1);
    }

    @Test
    void outboxCommitAndRollbackShareTheTransactionBoundary() {
        String committedId = "commit-" + UUID.randomUUID();
        transactionTemplate.executeWithoutResult(status -> enqueue(committedId));
        assertThat(outboxCount(committedId)).isOne();

        String rolledBackId = "rollback-" + UUID.randomUUID();
        transactionTemplate.executeWithoutResult(status -> {
            enqueue(rolledBackId);
            status.setRollbackOnly();
        });
        assertThat(outboxCount(rolledBackId)).isZero();
    }

    @Test
    void kafkaBrokerAcceptsAnOutboxPayload() throws Exception {
        String topic = "shopverse.test.inventory." + UUID.randomUUID();
        var result = kafkaTemplate.send(topic, "inventory-key", "{\"status\":\"test\"}")
                .get(10, TimeUnit.SECONDS);

        assertThat(result.getRecordMetadata().topic()).isEqualTo(topic);
        assertThat(result.getRecordMetadata().offset()).isGreaterThanOrEqualTo(0);
    }

    private void enqueue(String aggregateId) {
        outboxService.enqueue(
                "INVENTORY",
                aggregateId,
                "InventoryIntegrationTestEvent",
                "shopverse.inventory.reserved",
                aggregateId,
                Map.of("orderNumber", aggregateId),
                "correlation-" + aggregateId
        );
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from information_schema.tables where table_schema = database() and table_name = ?",
                Integer.class,
                tableName
        );
        return count != null && count == 1;
    }

    private int outboxCount(String aggregateId) {
        Integer count = jdbcTemplate.queryForObject(
                "select count(*) from outbox_events where aggregate_id = ?",
                Integer.class,
                aggregateId
        );
        return count == null ? 0 : count;
    }

    private int count(String sql) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
        return count == null ? 0 : count;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject(
                """
                select count(*) from information_schema.columns
                where table_schema = database() and table_name = ? and column_name = ?
                """,
                Integer.class,
                tableName,
                columnName
        );
        return count != null && count == 1;
    }
}
