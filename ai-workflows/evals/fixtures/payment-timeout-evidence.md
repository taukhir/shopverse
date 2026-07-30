# Synthetic payment evidence

- Operation `capture:ORD-42` timed out after the provider accepted the request.
- The local row is `TIMED_OUT`; no provider reference was stored.
- A retry generated a new provider idempotency key and returned success.
- A late callback for the first request then reported success.
- Refund is an authenticated local state change; provider verification is not shown.

The provider supports lookup and refund by stable merchant operation ID. No real
credentials or customer data are available to the reviewer.
