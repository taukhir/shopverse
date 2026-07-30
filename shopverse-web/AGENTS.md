# ShopVerse Web Guidance

## Application Conventions

This is an Angular 22 application using standalone components, signals,
zoneless change detection, `ChangeDetectionStrategy.OnPush`, Vitest, Playwright,
axe accessibility checks, visual regression tests, and Lighthouse budgets.

- Follow the existing `core/`, `features/`, `layouts/`, and `shared/` boundaries.
- Prefer signals and computed state following nearby components; do not introduce
  a second state-management approach for a focused change.
- Keep API paths centralized and API/domain types explicit.
- Preserve lazy-loaded routes and authorization guards.
- Reuse existing feedback, UI-state, error-message, and shared components before
  adding another pattern.

## Checkout And Security

- Preserve `Idempotency-Key` generation and reuse semantics across a single
  checkout attempt. Never create duplicate submissions to simulate recovery.
- Prevent repeated submission while preserving visible progress and a recoverable
  failure path.
- Map technical errors to actionable user-safe messages; do not display stack,
  database, broker, token, or internal service details.
- Client guards and hidden controls are not authorization. Backend services must
  enforce ownership and roles.
- Do not persist access tokens or sensitive checkout/customer information in
  insecure browser storage, URLs, analytics, or console logs.

## User Experience And Accessibility

- Design and test loading, empty, success, validation, authorization, offline,
  timeout, and unknown-failure states.
- Preserve semantic HTML, programmatic labels, keyboard access, visible focus,
  appropriate live-region behavior, contrast, reduced-motion behavior, and
  stable layouts.
- Validate at representative desktop and narrow mobile viewports.
- Do not approve a UI change from source inspection alone when browser behavior
  or visual layout is material.
- Avoid collecting analytics fields that contain tokens, idempotency keys,
  addresses, free-form personal data, or payment information.

## Tests

Run from `shopverse-web/`:

```powershell
npm run build
npm run test
npm run e2e:quick
npm run a11y
npm run lighthouse
```

Use `npm run check:web:quick` for the standard combined check when browser
prerequisites are available. Run `npm run e2e`, visual regression, or full-stack
smoke coverage when the affected surface justifies it. Do not update visual
baselines until the intended change has been inspected.

## Review Focus

Check API compatibility, state races, subscription/error handling, duplicate
actions, responsive layout, accessibility, user-safe content, Core Web Vitals,
and focused tests for the changed behavior.
