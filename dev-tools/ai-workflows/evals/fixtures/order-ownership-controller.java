package eval.fixture;

// Synthetic example for evaluation only; it is not production source.
final class OrderController {
    private final OrderRepository repository;

    OrderResponse getOrder(String authenticatedCustomerId, String orderNumber) {
        var order = repository.findByOrderNumber(orderNumber).orElseThrow();
        return OrderResponse.from(order);
    }
}
