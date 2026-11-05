# Bounded Validation Task

The checkout request contains item records with `productId` and integer
`quantity`. Existing validation already rejects null items and missing product
IDs. The new rule is:

```text
quantity must be between 1 and 20 inclusive
```

Acceptance evidence:

- quantities `1` and `20` are accepted;
- quantities `0`, `-1`, and `21` are rejected by request validation;
- the public DTO shape is unchanged;
- no event, entity, migration, dependency, or other service changes;
- a focused Order service test and the Order service unit suite pass.
