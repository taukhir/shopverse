package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;

import io.shopverse.labs.order.OrderApplicationService;
import io.shopverse.labs.order.OrderRepository;
import jakarta.persistence.EntityManager;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class NPlusOneQueryTest {
    @Autowired OrderApplicationService service;
    @Autowired OrderRepository orders;
    @Autowired EntityManager entityManager;

    @BeforeEach
    void seed() {
        orders.deleteAll();
        service.placeOrder("customer-1", "SKU-1", 1);
        service.placeOrder("customer-2", "SKU-2", 1);
        service.placeOrder("customer-3", "SKU-3", 1);
        entityManager.flush();
        entityManager.clear();
    }

    @Test
    void lazyTraversalMakesTheNPlusOneVisibleInStatementMetrics() {
        var statistics = entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        var result = orders.findAll();
        result.forEach(order -> assertThat(order.getLines()).hasSize(1));

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(4);
    }

    @Test
    void entityGraphCollapsesTheNPlusOneIntoOneStatement() {
        var statistics = entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        var result = orders.findAllWithLines();
        result.forEach(order -> assertThat(order.getLines()).hasSize(1));

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(1);
    }
}
