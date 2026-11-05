# Ownership Requirement

- A customer may retrieve only an order whose `customerId` matches the
  authenticated subject.
- An authenticated customer can guess another valid order number.
- Returning `404 Not Found` for both missing and non-owned orders is preferred to
  avoid disclosing whether another customer's order exists.
- The repository offers `findByOrderNumberAndCustomerId(orderNumber, customerId)`.
