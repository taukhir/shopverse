package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.shopverse.labs.order.OrderEntity;
import io.shopverse.labs.order.OrderRepository;
import jakarta.persistence.EntityManager;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLTransientConnectionException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.open-in-view=false",
        "spring.datasource.hikari.maximum-pool-size=2",
        "spring.datasource.hikari.minimum-idle=0",
        "spring.datasource.hikari.connection-timeout=300"
})
class PostgresJpaProductionTest {
    @Container
    static final PostgreSQLContainer POSTGRES =
            new PostgreSQLContainer("postgres:17-alpine")
                    .withDatabaseName("shopverse_lab")
                    .withUsername("shopverse")
                    .withPassword("shopverse");

    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", POSTGRES::getDriverClassName);
    }

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;
    @Autowired OrderRepository orders;

    @BeforeEach
    void prepareSchemaAndData() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            ScriptUtils.executeSqlScript(connection,
                    new ClassPathResource("db/postgres/V001__order_performance_indexes.sql"));
        }
        jdbc.execute("truncate table shop_order_lines, shop_orders cascade");
        jdbc.execute("truncate table lab_inventory, lab_deadlock_account");
        jdbc.update("insert into lab_inventory(sku, available) values (?, ?)", "SKU-1", 10);
        jdbc.update("insert into lab_deadlock_account(id, balance) values (1, 100), (2, 100)");
        jdbc.execute("""
                insert into shop_orders(id, customer_id, status, total, version, created_at, created_by)
                select md5(g::text)::uuid,
                       'customer-' || (g % 50),
                       case when g % 4 = 0 then 'CONFIRMED' else 'PENDING' end,
                       (g % 1000)::numeric(19, 2),
                       0,
                       now() - (g || ' seconds')::interval,
                       'postgres-lab'
                from generate_series(1, 5000) g
                """);
        jdbc.execute("analyze shop_orders");
    }

    @Test
    void compositeIndexSupportsTheFilterAndStableOrdering() {
        jdbc.execute("set enable_seqscan = off");
        List<String> plan = jdbc.queryForList("""
                explain (analyze, buffers, format text)
                select id, total
                from shop_orders
                where status = 'PENDING'
                order by total desc, id desc
                limit 50
                """, String.class);

        String evidence = String.join("\n", plan);
        assertThat(evidence)
                .contains("shop_orders_status_total_id_idx")
                .contains("actual time")
                .contains("Buffers");
    }

    @Test
    void keysetPageContinuesAfterTheExactCursorTuple() {
        List<OrderCursor> first = jdbc.query("""
                select id, total
                from shop_orders
                where status = 'PENDING'
                order by total desc, id desc
                limit 25
                """, (rs, row) -> new OrderCursor(
                rs.getObject("id", UUID.class), rs.getBigDecimal("total")));
        OrderCursor cursor = first.getLast();

        List<OrderCursor> second = jdbc.query("""
                select id, total
                from shop_orders
                where status = 'PENDING'
                  and (total, id) < (?, ?)
                order by total desc, id desc
                limit 25
                """, (rs, row) -> new OrderCursor(
                rs.getObject("id", UUID.class), rs.getBigDecimal("total")),
                cursor.total(), cursor.id());

        assertThat(first).hasSize(25);
        assertThat(second).hasSize(25);
        assertThat(second).doesNotContainAnyElementsOf(first);
        assertThat(second.getFirst().total()).isLessThanOrEqualTo(cursor.total());
    }

    @Test
    void thirdConnectionTimesOutWhenTheTwoConnectionBudgetIsConsumed() throws Exception {
        try (Connection first = dataSource.getConnection();
             Connection second = dataSource.getConnection()) {
            assertThatThrownBy(dataSource::getConnection)
                    .isInstanceOf(SQLTransientConnectionException.class)
                    .hasMessageContaining("Connection is not available");
        }
    }

    @Test
    void conditionalUpdateProtectsInventoryWithoutAReadModifyWriteRace() {
        int accepted = jdbc.update("""
                update lab_inventory
                set available = available - ?, version = version + 1
                where sku = ? and available >= ?
                """, 7, "SKU-1", 7);
        int rejected = jdbc.update("""
                update lab_inventory
                set available = available - ?, version = version + 1
                where sku = ? and available >= ?
                """, 7, "SKU-1", 7);

        assertThat(accepted).isOne();
        assertThat(rejected).isZero();
        assertThat(jdbc.queryForObject(
                "select available from lab_inventory where sku = 'SKU-1'", Integer.class))
                .isEqualTo(3);
    }

    @Test
    void oppositeLockOrderingProducesPostgresDeadlockEvidence() throws Exception {
        CountDownLatch bothFirstRowsLocked = new CountDownLatch(2);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<String> first = transferWithLockOrder(1, 2, bothFirstRowsLocked);
            Callable<String> second = transferWithLockOrder(2, 1, bothFirstRowsLocked);
            var firstResult = executor.submit(first);
            var secondResult = executor.submit(second);

            List<String> outcomes = List.of(
                    firstResult.get(),
                    secondResult.get());

            assertThat(outcomes).contains("committed", "40P01");
        }
    }

    @Test
    @Transactional
    void bulkJpqlBypassesTheAlreadyManagedEntityState() {
        OrderEntity managed = orders.findAll().getFirst();
        assertThat(managed.getStatus()).isIn("PENDING", "CONFIRMED");
        String current = managed.getStatus();
        String next = current.equals("PENDING") ? "ARCHIVED" : "SETTLED";

        int changed = orders.bulkTransition(current, next);
        assertThat(changed).isPositive();
        assertThat(managed.getStatus()).isEqualTo(current);

        UUID id = managed.getId();
        entityManager.clear();
        assertThat(entityManager.find(OrderEntity.class, id).getStatus()).isEqualTo(next);
    }

    private Callable<String> transferWithLockOrder(
            int firstId, int secondId, CountDownLatch bothFirstRowsLocked) {
        return () -> {
            try (Connection connection = dataSource.getConnection()) {
                connection.setAutoCommit(false);
                try {
                    connection.createStatement().execute("set deadlock_timeout = '100ms'");
                    updateAccount(connection, firstId);
                    bothFirstRowsLocked.countDown();
                    assertThat(bothFirstRowsLocked.await(5, TimeUnit.SECONDS)).isTrue();
                    updateAccount(connection, secondId);
                    connection.commit();
                    return "committed";
                } catch (SQLException failure) {
                    connection.rollback();
                    return failure.getSQLState();
                }
            }
        };
    }

    private void updateAccount(Connection connection, int id) throws SQLException {
        try (var statement = connection.prepareStatement("""
                update lab_deadlock_account set balance = balance + 1 where id = ?
                """)) {
            statement.setInt(1, id);
            statement.executeUpdate();
        }
    }

    private record OrderCursor(UUID id, java.math.BigDecimal total) {}
}
