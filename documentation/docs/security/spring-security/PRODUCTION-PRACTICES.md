---
title: Spring Security Production Practices
---

# Spring Security Production Practices

Password security, related guides, and official references.

Back to [Spring Security](../SPRING-SECURITY-GENERIC.md).

## Password Security

- store only adaptive password hashes;
- use BCrypt, Argon2, PBKDF2, or scrypt through `PasswordEncoder`;
- never decrypt passwords because they should not be encrypted reversibly;
- rate-limit login attempts;
- use generic authentication errors;
- monitor credential stuffing;
- support account lock and recovery;
- rehash when encoder strength changes.

`DelegatingPasswordEncoder` stores an algorithm identifier such as
`{bcrypt}` with the hash, supporting migration between encoders.


## Related Guides

- [Shopverse JWT and OAuth2 implementation](../JWT-OAUTH2-SPRING-SECURITY.md)
- [API Gateway](../../development/API-GATEWAY-GENERIC.md)
- [Spring Cloud OpenFeign](../../spring/SPRING-OPENFEIGN.md)
- [Testing](../../development/TESTING.md)


## Official References

- [Spring Security architecture](https://docs.spring.io/spring-security/reference/servlet/architecture.html)
- [Username/password authentication](https://docs.spring.io/spring-security/reference/servlet/authentication/passwords/index.html)
- [OAuth2 Resource Server JWT](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [Method security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Spring Authorization Server](https://docs.spring.io/spring-authorization-server/reference/)




