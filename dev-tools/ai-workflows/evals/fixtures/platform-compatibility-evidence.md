# Synthetic platform compatibility evidence

- A security starter changes the default authority prefix and configuration property.
- User, Order, Payment, and Inventory adopt the starter at different snapshot versions.
- Gateway and Auth intentionally do not use the servlet security starter.
- The proposal updates only the starter unit test and has no adopter context tests.
- Rollback, deprecation, configuration migration, and release notes are absent.
