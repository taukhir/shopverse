package eval.fixture;

// Synthetic example for evaluation only; it is not production source.
final class InventoryReservedConsumer {
    private final PaymentRepository repository;
    private final PaymentProvider provider;

    void onInventoryReserved(InventoryReserved event) {
        provider.capture(event.orderNumber(), event.total());
        repository.save(new Payment(event.orderNumber(), "COMPLETED"));
    }
}

record InventoryReserved(String eventId, String orderNumber, long total) {}

interface PaymentRepository {
    void save(Payment payment);
}

interface PaymentProvider {
    void capture(String orderNumber, long total);
}

record Payment(String orderNumber, String status) {}
