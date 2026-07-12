# Shopverse Web

Angular storefront and administration UI for the Shopverse local POC.

The app runs on port `4200` in local development and in the full-stack Docker
overlay. It talks to the backend through the API Gateway at `localhost:8080`.

## Responsibilities

- Customer login and registration.
- Product catalog, category, product-detail, and related-product browsing.
- Persisted cart, account-cart merge, and checkout flow with saved delivery address.
- Customer order and order-detail views.
- Customer order cancellation, payment retry, refund request, and return request actions.
- Account/profile management and address book.
- Admin views for users, orders, inventory, payments, recovery, and fulfillment workflows.

## Current Backend Integrations

The UI is wired to the API Gateway through `/api` and `/auth`.

| Area | Frontend behavior | Backend APIs |
|---|---|---|
| Auth/session | Login, admin/customer navigation, protected API auth header | `POST /auth/login`, `GET /api/v1/users/me` |
| Catalog | Product grid, detail page, related products, categories fallback | `GET /api/v1/inventory/public/items`, `GET /api/v1/inventory/public/items/{id}`, `GET /api/v1/inventory/public/items/{id}/related`, `GET /api/v1/inventory/public/categories` |
| Cart | Local fallback, persisted account cart, merge local cart after login | `GET/PUT /api/v1/cart`, `POST /api/v1/cart/merge`, `POST /api/v1/cart/validate`, `DELETE /api/v1/cart/items/{productId}` |
| Account | Profile edit and address CRUD | `GET/PUT/PATCH /api/v1/users/me`, `GET/POST/PUT/DELETE /api/v1/users/me/addresses` |
| Checkout | Requires saved address, sends shipping snapshot and idempotency key | `POST /api/v1/orders/checkout` |
| Orders | History, detail, timeline, delivery snapshot, cancel, return request | `GET /api/v1/orders`, `GET /api/v1/orders/{id}`, `GET /api/v1/orders/{id}/timeline`, `POST /api/v1/orders/{id}/cancel`, `POST /api/v1/orders/{id}/return-request` |
| Payments | Customer retry/refund actions and admin payment operations | `GET /api/v1/payments/orders/{orderNumber}`, `POST /api/v1/payments/orders/{orderNumber}/retry`, `POST /api/v1/payments/orders/{orderNumber}/refund` |
| Admin fulfillment | Pack, ship/out-for-delivery, deliver, cancel | `POST /api/v1/orders/admin/{id}/pack`, `POST /api/v1/orders/admin/{id}/ship`, `POST /api/v1/orders/admin/{id}/deliver`, `POST /api/v1/orders/admin/{id}/cancel` |

## Local Development

Install dependencies once:

```powershell
npm ci
```

Start the Angular development server:

```powershell
npm start -- --proxy-config proxy.conf.json
```

Open:

```text
http://localhost:4200
```

`proxy.conf.json` forwards `/api` and `/auth` to the API Gateway on
`http://localhost:8080`, so start the backend stack before exercising real
catalog, auth, checkout, or admin flows.

Recommended local backend startup from the repository root:

```powershell
docker compose --profile apps --profile assets up -d mysql mysql-bootstrap kafka minio minio-init config-server discovery-server user-service auth-service order-service payment-service inventory-service api-gateway
```

## Docker

The full-stack Compose overlay builds this app and serves it with nginx:

```powershell
docker compose --profile apps --profile assets -f docker-compose.yml -f docker-compose.full-stack.yml up --build shopverse-web
```

The nginx config proxies `/api` and `/auth` to `api-gateway:8080` and falls
back to `index.html` for Angular client-side routes.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | run Angular dev server |
| `npm run build` | production build |
| `npm run build:dev` | development build |
| `npm test` | Angular unit-test command |

No end-to-end test runner is configured yet.

## Runtime Notes

- Access tokens are stored in `sessionStorage` for the local POC.
- Cart state is stored in `localStorage` first, then synced to `/api/v1/cart`
  when the customer is authenticated.
- Product catalog/detail data comes from Inventory public APIs, with the older
  Order catalog endpoint used as a fallback where needed.
- Product images are loaded from MinIO URLs returned by Inventory.
- Checkout requires at least one saved account address. The selected address is
  sent as an immutable order shipping snapshot.
- Customer payment retry/refund and return request actions are enabled only
  when the current backend status allows them.
- Admin fulfillment actions are state-gated:
  `CONFIRMED -> PACKING -> SHIPPED -> OUT_FOR_DELIVERY -> DELIVERED`.
- Protected API calls attach `Authorization: Bearer <token>`.

## Validation

Build before handing off frontend changes:

```powershell
npm.cmd run build
```

Expected output:

```text
dist/shopverse-web
```

No end-to-end test runner is configured yet. For now, smoke-test with the full
backend stack:

1. Sign in as a customer.
2. Add or edit an account address.
3. Add a product to cart and refresh to confirm cart restore.
4. Checkout with the saved address.
5. Open order detail and verify timeline/payment/delivery sections.
6. Use admin order detail to pack, ship, and deliver.
7. Use customer order detail to request return when delivered.

## Related Docs

- [Root quick start](../README.md)
- [API guide](../documentation/docs/development/API-GUIDE.md)
- [Service catalog](../documentation/docs/services/SERVICE-CATALOG.md)
- [Complete demo](../documentation/docs/case-study/COMPLETE-DEMO.mdx)
