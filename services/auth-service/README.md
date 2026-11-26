# Auth Service

Auth Service runs on port `8081`. It authenticates credentials through User Service, issues RSA-signed JWT access tokens, and exposes the public JWKS used by resource services.

## APIs

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/auth/csrf` | issue the readable CSRF cookie used by browser mutations |
| `POST` | `/auth/login` | authenticate username/password and set an HttpOnly access cookie |
| `GET` | `/auth/session` | return browser identity and roles, or an anonymous session |
| `POST` | `/auth/logout` | revoke the authenticated access token and clear browser cookies |
| `GET` | `/auth/.well-known/jwks.json` | publish the RSA public key set |
| `GET` | `/actuator/health` | runtime health |
| `GET` | `/actuator/prometheus` | Prometheus metrics |

Login request:

```json
{
  "username": "admin",
  "password": "<password>"
}
```

Swagger is available at `/swagger-ui/index.html` when the service is reached
directly.

## Authentication Flow

1. Auth Service receives validated credentials.
2. its Feign client calls `/api/v1/internal/users/authenticated` on `USER-SERVICE`.
3. an interceptor supplies internal Basic authentication.
4. User Service loads the database user, roles, and permissions and verifies BCrypt credentials.
5. Auth Service creates claims and signs the JWT through `JwtEncoder`.

The token contains issuer, subject, issue/expiry time, ID, roles, and permissions. The issuer is `shopverse-auth-service`.

### Access-token logout and revocation

`POST /auth/logout` requires the current authenticated access token. Auth Service stores
only its `jti` as a Redis revocation marker under
`shopverse:auth:revoked-jti:v1:<jti>`, with a TTL ending at the token expiry.
The full JWT is never written to Redis. Gateway and the User, Order, Payment,
and Inventory resource servers check the same marker after validating the JWT
signature, issuer, and timestamps. Revocation checks fail closed if Redis
cannot be reached. Logout revokes the presented access token; it does not revoke
other tokens for the same user or implement refresh-token/session management.

### Browser cookie and CSRF flow

The Angular browser uses a direct HttpOnly-cookie transport. This is **not a
BFF and not a server-side session**: the cookie contains the signed JWT; Auth
Service and resource servers continue validating that JWT. Angular holds only
the non-authoritative UI identity in memory.

#### 1. Get a CSRF token before login

```http
GET /auth/csrf
```

Auth Service creates 32 random bytes, Base64URL-encodes them, and returns an
`XSRF-TOKEN` cookie. It is intentionally readable by Angular (`HttpOnly=false`)
so Angular can copy it into `X-XSRF-TOKEN`. This value is only an anti-CSRF
proof; it is not an authentication credential.

```java
byte[] random = new byte[32];
secureRandom.nextBytes(random);
return ResponseEntity.noContent()
    .header(HttpHeaders.SET_COOKIE,
        csrfCookie(Base64.getUrlEncoder().withoutPadding().encodeToString(random), accessTokenTtl).toString())
    .build();
```

#### 2. Login and set the access cookie

Angular's `SessionService.login()` first calls `/auth/csrf`, then posts the
credentials to `/auth/login`. The browser stores the cookies from responses
and sends them on later same-origin/proxied API requests; Angular never reads
the access cookie.

```typescript
return this.http.get<void>('/auth/csrf').pipe(
  concatMap(() => this.http.post<{ authenticated: boolean }>('/auth/login', { username, password })),
  switchMap(() => this.fetchSession().pipe(
    switchMap((session) => session ? of(session) : throwError(() => new Error('Session was not restored'))),
  )),
  tap((session) => this.setSession(session)),
);
```

Auth Service still validates credentials through User Service and signs the
JWT. It returns the JWT only in the cookie, with `HttpOnly`, `SameSite=Lax`,
`Path=/`, bounded `Max-Age`, and `Secure` controlled by
`security.browser.cookie-secure`; the JSON response is `{ "authenticated":
true }` and is `Cache-Control: no-store`.

```java
return ResponseEntity.status(HttpStatus.OK)
    .cacheControl(CacheControl.noStore())
    .header(HttpHeaders.SET_COOKIE,
        accessCookie(issued.token(), accessTokenTtl).toString())
    .body(new LoginResponse(true));
```

#### 3. What `/auth/session` returns

```http
GET /auth/session
```

Gateway validates the `SHOPVERSE_ACCESS` cookie as a JWT. Auth Service returns
`authenticated`, `username`, `roles`, and `expiresAt`, with `Cache-Control:
no-store`. With no valid authenticated principal, it returns
`{ "authenticated": false, "username": null, "roles": [], "expiresAt": null }`.
Angular uses this response for route guards and displaying identity/role-based
navigation only. Service authorization remains authoritative.

An absent cookie produces the anonymous response. A supplied but invalid or
expired cookie can instead be rejected by JWT authentication with `401`; Angular
then clears its in-memory state and sends the user to login. The endpoint does
not extend the JWT expiry.

```json
{
  "authenticated": true,
  "username": "admin",
  "roles": ["ROLE_ADMIN"],
  "expiresAt": "2026-11-25T13:00:00Z"
}
```

The response DTO intentionally contains no JWT:

```java
public record BrowserSessionResponse(
    boolean authenticated,
    String username,
    List<String> roles,
    Instant expiresAt
) {}
```

#### 4. Browser mutations and CSRF

Angular configures `XSRF-TOKEN` and `X-XSRF-TOKEN` through
`withXsrfConfiguration`. For unsafe methods, it sends both the cookie (the
browser does this) and the matching header (Angular reads the CSRF value).
Gateway's `BrowserCookieCsrfWebFilter` rejects the request with `403` unless:

1. the request has a configured trusted `Origin` (or an allowed `Referer` when
   `Origin` is absent); and
2. the `XSRF-TOKEN` cookie and `X-XSRF-TOKEN` header are both present and match.

This applies to requests carrying the access or CSRF cookie, and explicitly to
configured Auth mutations such as login/logout. Auth Service also enables
Spring Security's cookie-backed CSRF protection for its own unsafe endpoints.
`SameSite=Lax` is defense in depth; it does not replace token and origin checks.

```typescript
provideHttpClient(
  withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
  withInterceptors([authInterceptor]),
)
```

The auth interceptor now adds a correlation ID and handles `401`; it does not
read a token or set an `Authorization` header.
The current storefront proxy serves `/auth` and `/api` through the storefront
origin, so cookies are same-origin in local development and the nginx setup.
`BROWSER_CSRF_ALLOWED_ORIGINS` validates the request Origin; it does not itself
configure CORS. A deployment that separates UI and API origins also needs
explicit credentialed CORS configuration for the exact UI origin.

#### 5. Gateway validation and downstream forwarding

`BrowserCookieTokenConverter` prefers the access cookie and converts it into
Spring Security's bearer-token authentication input. If no access cookie is
present, it preserves the `Authorization: Bearer` path for callers that already
have a token. The Gateway validates signature, issuer, time claims, and Redis
revocation state. `BrowserCookieTokenRelayFilter` then places the cookie value
in the internal `Authorization` header and removes the access cookie from the
forwarded `Cookie` header. Resource services independently validate the JWT
and authorize the requested operation.

The core cookie-to-bearer conversion is:

```java
HttpCookie cookie = exchange.getRequest().getCookies().getFirst(accessCookieName);
if (cookie != null && !cookie.getValue().isBlank()) {
    return Mono.just(new BearerTokenAuthenticationToken(cookie.getValue()));
}
return headerConverter.convert(exchange); // retain explicit Bearer clients
```

#### 6. Page reload versus token refresh

After a full browser page reload, Angular starts with empty in-memory signals.
The route guard calls `/auth/session`; the browser automatically sends the
HttpOnly cookie, so the UI identity is restored without reading browser storage
or the JWT. `SessionService` deletes the old `shopverse.session.token` storage
entry once as migration cleanup.

This is **not** an OAuth refresh-token flow. There is no `/auth/refresh` route,
refresh token, rotation, or silent renewal. When the access JWT expires, the
cookie expires and protected calls fail authentication; Angular clears its
in-memory identity and routes to login. The user must authenticate again.

#### 7. Logout

Angular calls `POST /auth/logout` with the cookies and CSRF header. Auth Service
revokes the presented JWT's `jti` in Redis through the token's expiry, then
expires both `SHOPVERSE_ACCESS` and `XSRF-TOKEN` cookies. Angular clears the
in-memory identity after a successful response. This revokes only this access
token; it is not logout-all or session-family revocation.

```java
accessTokenRevocationService.revoke(jwt);
return ResponseEntity.noContent()
    .header(HttpHeaders.SET_COOKIE, accessCookie("", Duration.ZERO).toString())
    .header(HttpHeaders.SET_COOKIE, csrfCookie("", Duration.ZERO).toString())
    .build();
```

```typescript
logoutFromServer(): Observable<void> {
  return this.http.post<void>('/auth/logout', {}).pipe(
    tap(() => this.clearSession()),
  );
}
```

Production must use HTTPS, `BROWSER_COOKIE_SECURE=true`, and the exact storefront
origins in `BROWSER_CSRF_ALLOWED_ORIGINS`; never use wildcard origins with
credentialed CORS. HttpOnly reduces token extraction by JavaScript but does not
stop XSS from issuing authenticated requests in the user's browser.

**Client compatibility:** `/auth/login` now returns an authenticated flag and
sets a cookie; it no longer returns a JWT in JSON. A non-browser client that
depends on receiving a Bearer token from this endpoint needs a separate,
explicitly designed client contract; do not assume that legacy response is
still available.

## Key Lifecycle And Failure Contract

- RSA private-key material remains an Auth Service secret; only public JWK values
  are exposed.
- Rotate keys by publishing the new public key before issuing tokens with it, keep
  the previous public key available for the remaining token lifetime, then retire it.
- Resource services validate signature, issuer, timestamps, and Redis revocation
  state. Clock skew and token lifetime must remain bounded and configuration-reviewed.
- Invalid credentials return an authentication failure without revealing whether
  the username exists. Dependency or signing failures must not produce a token.
- Rate-limit login attempts and alert on abnormal failures, JWKS retrieval errors,
  signing errors, and User Service authentication latency.

## Feign And Tracing

The client uses the Eureka name `USER-SERVICE`. Spring Cloud LoadBalancer chooses an instance. `FeignCorrelationConfig` forwards `X-Correlation-Id`; Micrometer instrumentation propagates trace headers.

See:

- [Spring Cloud OpenFeign](https://taukhir.github.io/shopverse-docs/spring/SPRING-OPENFEIGN)
- [JWT and Spring Security](https://taukhir.github.io/shopverse-docs/security/JWT-OAUTH2-SPRING-SECURITY)
- [Generic Spring Security](https://taukhir.github.io/shopverse-docs/security/SPRING-SECURITY-GENERIC)
- [MDC and tracing](https://taukhir.github.io/shopverse-docs/observability/MDC-CORRELATION-TRACING)

## Configuration

Runtime configuration comes from `infra/cloud-configs/AUTH-SERVICE.yml` and the shared `application.yml` through Config Server. Important values include RSA key material/path, JWT issuer, Redis connection settings and revocation key prefix, internal User Service credentials, Eureka URL, Zipkin endpoint, and log path.

Real credentials and private keys must not be committed. Local POC values may be supplied through `.env`.

## Tests And Observability

```powershell
./gradlew test
```

Prometheus scrapes `/actuator/prometheus`. Search Auth Service logs with:

```logql
{log_type="application", application="AUTH-SERVICE"}
```

## Run

```powershell
./gradlew bootRun
```

```powershell
docker compose build auth-service
docker compose up -d auth-service
```

## Limitations

Shopverse uses JWT validation at the Gateway and resource services; the browser
client transports its JWT in an HttpOnly cookie. Gateway can accept an explicit
Bearer token, but `/auth/login` does not return one in JSON and no separate
non-browser token-issuing flow is currently defined. This service is not a
complete OAuth2 Authorization Server and does not currently issue refresh
tokens, revoke all sessions for a user, provide consent, or automate
signing-key rotation. HttpOnly reduces direct token theft by injected
JavaScript, but XSS can still issue authenticated requests as the user.
Production deployments must use HTTPS, secure cookies, explicit trusted origins,
and signing keys from a secret manager or KMS/HSM boundary.

## AI-Assisted Development

Use AI to trace login and JWKS flows, review token claims and expiry, diagnose
Auth-to-User calls, generate negative authentication tests, and inspect sensitive
logging. Follow scoped [`AGENTS.md`](AGENTS.md), imported by
[`CLAUDE.md`](CLAUDE.md), and the reviewed
[security-review](../../dev-tools/ai-workflows/prompts/security-review.md),
[feature](../../dev-tools/ai-workflows/prompts/implement-feature.md), and
[incident](../../dev-tools/ai-workflows/prompts/incident-investigation.md) workflows.

Never provide private keys, credentials, bearer tokens, or real user records to
an AI tool. Require evidence before changing issuer, audience, signing, JWKS,
internal authentication, or public error behavior. Shopverse is not a complete
OAuth2 Authorization Server; AI output must not describe refresh-token or consent
features as implemented.

The deterministic identity-security evaluation covers method authorization,
JWKS rotation, internal authentication, and secret leakage boundaries.

## Related Guides

- [Spring Cloud OpenFeign](https://taukhir.github.io/shopverse-docs/spring/SPRING-OPENFEIGN)
- [JWT and Spring Security](https://taukhir.github.io/shopverse-docs/security/JWT-OAUTH2-SPRING-SECURITY)
- [Shopverse observability operations](../../docs/observability/SHOPVERSE-OBSERVABILITY-OPERATIONS.md)
