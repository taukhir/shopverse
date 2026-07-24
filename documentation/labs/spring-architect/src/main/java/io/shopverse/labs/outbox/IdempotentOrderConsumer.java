package io.shopverse.labs.outbox;

import java.sql.SQLException;
import org.springframework.stereotype.Service;

@Service
public class IdempotentOrderConsumer {
    public static final String CONSUMER_NAME = "order-projection-v1";

    private final InboxTransactionProcessor transactions;

    public IdempotentOrderConsumer(InboxTransactionProcessor transactions) {
        this.transactions = transactions;
    }

    public boolean consume(OutboxMessage message) {
        try {
            transactions.apply(CONSUMER_NAME, message);
            return true;
        } catch (RuntimeException failure) {
            if (isUniqueViolation(failure)) {
                return false;
            }
            throw failure;
        }
    }

    private boolean isUniqueViolation(Throwable failure) {
        Throwable current = failure;
        while (current != null) {
            if (current instanceof SQLException sql
                    && "23505".equals(sql.getSQLState())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
