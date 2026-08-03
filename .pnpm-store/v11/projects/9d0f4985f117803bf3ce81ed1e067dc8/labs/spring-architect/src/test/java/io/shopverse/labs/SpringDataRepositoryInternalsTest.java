package io.shopverse.labs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import io.shopverse.labs.order.OrderApplicationService;
import io.shopverse.labs.order.OrderEntity;
import io.shopverse.labs.order.OrderRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.RollbackException;
import java.math.BigDecimal;
import java.util.UUID;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class SpringDataRepositoryInternalsTest {
    @Autowired OrderApplicationService service;
    @Autowired OrderRepository orders;
    @Autowired EntityManager entityManager;
    @Autowired EntityManagerFactory entityManagerFactory;

    @BeforeEach
    void seed() {
        orders.deleteAll();
        service.placeOrder("customer-1", "SKU-1", 1);
        service.placeOrder("customer-1", "SKU-2", 2);
        service.placeOrder("customer-2", "SKU-3", 3);
    }

    @Test
    void repositoryIsAProxyAndDispatchesDerivedDeclaredAndFragmentQueries() {
        assertThat(AopUtils.isAopProxy(orders)).isTrue();

        assertThat(orders.findByCustomerIdAndStatusOrderByTotalDesc(
                "customer-1", "PENDING")).hasSize(2);
        assertThat(orders.findSummariesByStatus("PENDING"))
                .allSatisfy(summary -> {
                    assertThat(summary.getId()).isNotNull();
                    assertThat(summary.getStatus()).isEqualTo("PENDING");
                });
        assertThat(orders.findOrdersAtOrAbove(new BigDecimal("39.98"), 10))
                .extracting(OrderEntity::getTotal)
                .containsExactly(new BigDecimal("59.97"), new BigDecimal("39.98"));
        assertThatThrownBy(() -> orders.findOrdersAtOrAbove(BigDecimal.ZERO, 101))
                .isInstanceOf(InvalidDataAccessApiUsageException.class)
                .hasCauseInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @Transactional
    void sliceAvoidsTheExactCountThatPageRequires() {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        var statistics = sessionFactory.getStatistics();
        entityManager.flush();
        entityManager.clear();

        statistics.clear();
        var slice = orders.findSliceByStatusOrderById("PENDING", PageRequest.of(0, 2));
        assertThat(slice.hasNext()).isTrue();
        long sliceStatements = statistics.getPrepareStatementCount();

        statistics.clear();
        var page = orders.findPageByStatusOrderById("PENDING", PageRequest.of(0, 2));
        assertThat(page.getTotalElements()).isEqualTo(3);
        long pageStatements = statistics.getPrepareStatementCount();

        assertThat(sliceStatements).isEqualTo(1);
        assertThat(pageStatements).isEqualTo(2);
    }

    @Test
    void auditingIsAppliedAtTheRepositorySaveBoundary() {
        OrderEntity order = orders.findAll().getFirst();
        assertThat(order.getCreatedAt()).isNotNull();
        assertThat(order.getCreatedBy()).isEqualTo("spring-data-lab");
        assertThat(order.getVersion()).isNotNegative();
    }

    @Test
    void optimisticVersionRejectsAStaleWriter() {
        UUID id = orders.findAll().getFirst().getId();
        EntityManager first = entityManagerFactory.createEntityManager();
        EntityManager stale = entityManagerFactory.createEntityManager();
        try {
            first.getTransaction().begin();
            stale.getTransaction().begin();
            OrderEntity firstCopy = first.find(OrderEntity.class, id);
            OrderEntity staleCopy = stale.find(OrderEntity.class, id);

            firstCopy.transitionTo("CONFIRMED");
            first.getTransaction().commit();

            staleCopy.transitionTo("CANCELLED");
            assertThatThrownBy(() -> stale.getTransaction().commit())
                    .isInstanceOf(RollbackException.class);
        } finally {
            if (first.getTransaction().isActive()) first.getTransaction().rollback();
            if (stale.getTransaction().isActive()) stale.getTransaction().rollback();
            first.close();
            stale.close();
        }
    }
}
