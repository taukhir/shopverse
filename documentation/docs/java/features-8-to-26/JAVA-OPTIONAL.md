---
title: Java Optional
sidebar_position: 2
---

# Java Optional

`Optional<T>` represents a value that may or may not be present.

It is best used as a return type when absence is a normal outcome.

```java
Optional<User> user = userRepository.findByUsername(username);
```

## Good Usage

```java
User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UserNotFoundException(username));
```

```java
return repository.findById(id)
        .map(mapper::toResponse)
        .orElseThrow(() -> new OrderNotFoundException(id));
```

## Avoid

Avoid Optional for:

- entity fields;
- method parameters;
- collection elements;
- every nullable local variable;
- serialization contracts unless intentionally designed.

Bad:

```java
void createUser(Optional<String> username) {
}
```

Better:

```java
void createUser(String username) {
}
```

Validate required input at boundaries.

## `orElse` vs `orElseGet`

```java
User user = optional.orElse(createGuestUser());
```

`orElse` evaluates `createGuestUser()` even when the Optional has a value.

```java
User user = optional.orElseGet(this::createGuestUser);
```

`orElseGet` evaluates lazily only when empty.

## Interview Questions

### Can Optional be null?

Technically yes, but it defeats the purpose. Never return `null` from a method
declared as returning `Optional<T>`.

### Why not use Optional in JPA entities?

JPA providers and serializers expect field values, not Optional wrappers.
Optional fields create mapping and serialization confusion.

### Is `Optional.get()` bad?

It is unsafe unless presence is already guaranteed. Prefer `orElseThrow`,
`map`, `flatMap`, or `ifPresent`.

