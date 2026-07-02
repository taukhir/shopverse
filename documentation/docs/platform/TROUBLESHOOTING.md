# Platform Troubleshooting

Use this page when a service fails after adopting a platform module.

## `NoSuchBeanDefinitionException: JwtAuthenticationConverter`

Likely causes:

- `shopverse-security-starter` is missing from `build.gradle`
- the service is not using `includeBuild('../shopverse-platform')`
- auto-configuration metadata is not on the classpath

Check:

```groovy
// settings.gradle
includeBuild('../shopverse-platform')
```

```groovy
// build.gradle
implementation 'io.shopverse.platform:shopverse-security-starter:0.0.1-SNAPSHOT'
```

## `Could not resolve io.shopverse.platform:*`

The service cannot see the local platform composite build.

Fix:

```groovy
// settings.gradle in the service folder
rootProject.name = 'payment-service'

includeBuild('../shopverse-platform')
```

Then refresh Gradle or rerun:

```powershell
.\gradlew.bat clean test --no-daemon
```

## `No qualifying bean of type OutboxEventStore`

The outbox starter is present, but the service did not provide its adapter.

Add a service-local implementation:

```java
@Service
class PaymentOutboxEventStore implements OutboxEventStore {
    // map service-owned OutboxEvent rows to platform OutboxMessage records
}
```

The starter cannot own service entities or repositories, so this adapter is
required in each outbox-enabled service.

## Outbox Events Stay In `PROCESSING`

Check these areas:

- Kafka broker availability
- topic names in the local outbox rows
- `shopverse.outbox.send-timeout-seconds`
- stale claim release through `shopverse.outbox.claim-timeout-ms`
- repository method used by the `OutboxEventStore` adapter

The starter will release stale claims when the processing claim is older than
the configured timeout.

## `No qualifying bean of type FailedKafkaEventStore`

The Kafka recovery starter is present, but the service did not provide the
failed-event repository adapter.

Add:

```java
@Service
class PaymentFailedKafkaEventStore implements FailedKafkaEventStore {
    // delegate to FailedKafkaEventRepository
}
```

Also add a replay adapter:

```java
@Service
class PaymentKafkaReplayOutbox implements KafkaReplayOutbox {
    // delegate to the service-owned OutboxService
}
```

## Replay Works But Metrics Show `unknown`

Set the service name:

```yaml
shopverse:
  kafka-recovery:
    service-name: payment
```

Without this property, the recovery starter uses the default `unknown` tag.

## Kafka Listener Parse Failures

If a listener fails after switching to `KafkaEventParser`, verify:

- the listener payload class matches the actual JSON
- the event record still belongs to the service
- the service has the same `ObjectMapper` customizations it used before
- the listener catches or routes `KafkaEventParseException` according to its DLT policy

The platform parser only centralizes parsing and exception wrapping. It does
not change event schemas.

## Gateway Does Not Pick Up Request Logging Or Security Starter

`api-gateway` is reactive WebFlux. The current observability and security
starters are servlet-based and target Spring MVC services.

Do not force these servlet starters into the gateway. A gateway extraction
should be a separate WebFlux starter with `WebFilter` and reactive security
configuration.

## Actuator Requests Are Not Logged

This is expected. The observability starter skips paths starting with
`/actuator/` by default.

Override only if needed:

```yaml
shopverse:
  observability:
    request-logging:
      actuator-path-prefix: /internal-actuator/
```

## Docs Page Does Not Appear In Sidebar

The docs website uses an explicit `documentation/sidebars.ts`. Adding a file
under `documentation/docs` is not enough.

Add the document ID to the Platform Infrastructure category:

```ts
{
  type: 'category',
  label: 'Platform Infrastructure',
  items: [
    'platform/DUPLICATE-LOGIC',
  ],
}
```

Then validate:

```powershell
cd documentation
npm.cmd run build
```
