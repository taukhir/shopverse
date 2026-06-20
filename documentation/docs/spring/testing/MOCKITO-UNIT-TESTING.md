---
title: Mockito And Unit Testing
---

# Mockito And Unit Testing

Mockito, mock usage, static and constructor mocking, PowerMockito guidance, and service unit tests.

Back to [Spring Boot Testing](../SPRING-BOOT-TESTING.md).

## Mockito

Mockito creates test doubles for collaborators:

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepository repository;

    @Mock
    PasswordEncoder passwordEncoder;

    UserServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(repository, passwordEncoder, ...);
    }
}
```

### Stubbing

```java
when(repository.findById(1L))
        .thenReturn(Optional.of(user));

when(repository.save(any(User.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
```

Stub only behavior needed by the current test. Excess stubbing makes tests
hard to understand and can hide incorrect interactions.

### Verification

```java
verify(repository).save(any(User.class));
verify(repository, never()).delete(any(User.class));
verify(auditService).record(user, "USER_CREATED", "User account created");
```

Verify important side effects and absences. Do not verify every implementation
call, because that couples the test to harmless refactoring.

### Argument Matchers

Common matchers:

```java
any()
any(User.class)
eq("ADMIN")
isNull()
argThat(user -> user.getStatus() == UserStatus.ACTIVE)
```

`any(User.class)` means any non-null argument compatible with `User` for that
stub or verification. It is not an assertion by itself.

When one argument uses a matcher, all arguments in that method call should use
matchers:

```java
verify(repository).findByStatusAndName(eq(ACTIVE), anyString());
```

Avoid:

```java
verify(repository).findByStatusAndName(ACTIVE, anyString());
```

### Argument Captor

Capture an object when its constructed state matters:

```java
ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);

verify(repository).save(captor.capture());

assertThat(captor.getValue().getPassword()).isEqualTo("hashed-password");
assertThat(captor.getValue().getStatus()).isEqualTo(UserStatus.ACTIVE);
```

Prefer matchers for simple selection and captors for detailed post-call
assertions.

### `@InjectMocks`

```java
@InjectMocks
UserServiceImpl service;
```

Mockito attempts constructor, setter, or field injection. Explicit constructor
creation is often clearer when a service has important dependencies or test
fixtures.

### Mock, Spy, Fake, And Stub

| Type | Meaning |
|---|---|
| Mock | programmable object whose interactions can be verified |
| Stub | provides canned answers |
| Spy | wraps a real object and overrides selected behavior |
| Fake | working simplified implementation, such as an in-memory repository |

Use spies sparingly. They often indicate a class with too many responsibilities.


## When To Use Mocks

Mock a collaborator when the test needs to control or observe an external
boundary:

- repository behavior in a service unit test;
- payment provider response;
- email, audit, or event publisher side effects;
- clock, UUID generator, or feature flag;
- remote HTTP client response.

Do not mock:

- the class under test;
- simple value objects and records;
- collections;
- JPA entities only to avoid constructing valid fixtures;
- every internal method;
- framework behavior that should be proven by a slice or integration test.

Example:

```java
@ExtendWith(MockitoExtension.class)
class CheckoutServiceTest {

    @Mock
    InventoryClient inventoryClient;

    @Mock
    OrderRepository orderRepository;

    @InjectMocks
    CheckoutService checkoutService;

    @Test
    void doesNotCreateOrderWhenInventoryIsUnavailable() {
        when(inventoryClient.reserve(any()))
                .thenReturn(ReservationResult.unavailable());

        assertThatThrownBy(() -> checkoutService.checkout(request))
                .isInstanceOf(InventoryUnavailableException.class);

        verify(orderRepository, never()).save(any());
    }
}
```

This test mocks process boundaries but executes the actual checkout decision.


## Mockito Static And Constructor Mocking

Modern Mockito can mock static methods and constructed objects when the inline
mock maker is available:

```java
try (MockedStatic<UUID> uuid = Mockito.mockStatic(UUID.class)) {
    uuid.when(UUID::randomUUID).thenReturn(fixedUuid);

    assertThat(service.createId()).isEqualTo(fixedUuid.toString());
}
```

Static mocking is scoped by try-with-resources and must be closed. Prefer
injecting an abstraction:

```java
@Bean
Clock applicationClock() {
    return Clock.systemUTC();
}
```

```java
Instant now = clock.instant();
```

An injectable `Clock`, ID generator, factory, or client makes production code
more explicit and tests simpler. Static or constructor mocking is a migration
tool, not the preferred design.


## PowerMock And PowerMockito

PowerMock/PowerMockito historically enabled mocking:

- static methods;
- constructors invoked with `new`;
- private methods;
- final classes and methods;
- static initializers.

It achieves this through custom class loading and bytecode manipulation.
That can conflict with modern JUnit, Java modules, coverage agents, IDE
runners, and Spring test infrastructure.

PowerMockito-style legacy example:

```java
@RunWith(PowerMockRunner.class)
@PrepareForTest(LegacyPaymentFactory.class)
public class LegacyPaymentServiceTest {

    @Test
    public void usesStubGateway() throws Exception {
        PaymentGateway gateway = mock(PaymentGateway.class);

        PowerMockito.mockStatic(LegacyPaymentFactory.class);
        when(LegacyPaymentFactory.create()).thenReturn(gateway);

        // exercise legacy code
    }
}
```

This is based on JUnit 4 and should not be introduced into new Spring Boot
code. Use it only when all of the following are true:

1. the code is legacy and cannot yet be refactored;
2. the behavior is important enough to require a characterization test;
3. Mockito cannot cover the required seam in the project's current setup;
4. the team accepts the runner, Java-version, and tooling constraints;
5. there is a planned refactoring path away from PowerMock.

Prefer:

- constructor injection;
- wrapper interfaces around static libraries;
- injectable factories;
- `Clock` and ID providers;
- Mockito scoped static mocking as a temporary fallback;
- integration tests around an immutable legacy boundary.

Do not mock private methods. Test observable behavior or extract the private
logic into a focused collaborator when it has independent complexity.


## Service Unit Tests

Service tests should cover:

- successful result;
- missing resource;
- duplicate/conflict paths;
- validation/business rule;
- state transition;
- important collaborator calls;
- no write when validation fails.

Shopverse-style example:

```java
@Test
void createUserHashesPasswordAndAssignsRoles() {
    when(repository.existsByUsername("ahmed")).thenReturn(false);
    when(passwordEncoder.encode("password123")).thenReturn("hashed-password");
    when(repository.save(any(User.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

    service.createUser(request);

    ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
    verify(repository).save(captor.capture());
    assertThat(captor.getValue().getPassword())
            .isEqualTo("hashed-password");
}
```

Do not start Spring for pure business logic. Mockito and direct construction
give faster and more focused feedback.







