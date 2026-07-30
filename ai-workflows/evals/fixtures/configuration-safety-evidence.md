# Synthetic configuration evidence

- A service-local value, shared `application.yml`, and environment variable define
  different timeouts; the effective origin was not recorded.
- A proposed gateway route exposes `/api/v1/internal/**`.
- A database password is replaced with a literal value for convenience.
- `/actuator/refresh` is called on one of three replicas without an audit record.
- A debug endpoint returns the complete effective environment.
- The rollback plan says only "revert if needed".
