# Synthetic gateway evidence

- User routes include `/api/v1/cart/**` and `/api/v1/admin/**`.
- `/api/v1/internal/**` must never be exposed through the gateway.
- The gateway validates JWT signature, issuer, and time claims; services enforce
  authorities and object ownership.
- Retry is configured for `GET` only. Filters are reactive and must not block.
- Process health is green while a required service is absent from Eureka.
