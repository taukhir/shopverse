# Shopverse Web

Angular storefront and administration UI for the Shopverse local POC.

The app runs on port `4200` in local development and in the full-stack Docker
overlay. It talks to the backend through the API Gateway at `localhost:8080`.

## Responsibilities

- Customer login and registration.
- Product catalog and product-detail browsing.
- Cart and checkout flow.
- Customer order and order-detail views.
- Account/profile management.
- Admin views for users, orders, inventory, payments, and recovery workflows.

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
- Cart state is stored in `localStorage`.
- Product images are loaded from MinIO URLs returned by Inventory.
- Protected API calls attach `Authorization: Bearer <token>`.

## Related Docs

- [Root quick start](../README.md)
- [API guide](../documentation/docs/development/API-GUIDE.md)
- [Service catalog](../documentation/docs/services/SERVICE-CATALOG.md)
- [Complete demo](../documentation/docs/case-study/COMPLETE-DEMO.mdx)
