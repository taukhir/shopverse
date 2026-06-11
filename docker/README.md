# Shopverse Docker Guide

## Local POC Secrets

Docker Compose reads local credentials and overrides from the repository root
`.env` file:

```powershell
Copy-Item .env.example .env
docker compose config
```

Keeping POC credentials in `.env` is acceptable for this local demo because
`.env` is ignored by Git and `.env.example` contains placeholders. Do not put
real secrets in Compose YAML, centralized config, README examples, image
layers, logs, or CI output. Before any shared or production deployment, use
Docker/Kubernetes secrets or a managed secret store and rotate any credential
that has been exposed.

The current repository also includes a known demo admin login and classpath RSA
keys to make the authentication flow runnable after cloning. Treat both as
disposable POC fixtures, not protected secrets. Replace the bootstrap password
and mount signing keys at runtime before deploying outside a local demo.

This guide keeps Docker and Docker Compose details in one place so the root README can stay focused on the project overview.

## Docker Compose Commands

Build all images:

```powershell
docker compose build
```

Build one service:

```powershell
docker compose build user-service
```

Start the full stack:

```powershell
docker compose up -d
```

Start and rebuild in one command:

```powershell
docker compose up -d --build
```

Check containers:

```powershell
docker compose ps
```

Rebuild and recreate one service:

```powershell
docker compose build user-service
docker compose up -d --force-recreate user-service
```

Restart application services:

```powershell
docker compose restart user-service auth-service order-service api-gateway
docker compose restart payment-service inventory-service
```

Follow all logs:

```powershell
docker compose logs -f
```

Follow one or more services:

```powershell
docker compose logs -f user-service
docker compose logs -f auth-service
docker compose logs -f order-service inventory-service payment-service
docker compose logs -f api-gateway
docker compose logs -f kafka
```

Check observability logs:

```powershell
docker compose logs -f promtail
docker compose logs -f loki
docker compose logs -f prometheus
docker compose logs -f grafana
docker compose logs -f zipkin
```

Search logs in PowerShell:

```powershell
docker compose logs | Select-String "ERROR"
docker compose logs | Select-String "Exception"
docker compose logs | Select-String "traceId"
docker compose logs | Select-String "Choreography saga"
```

Open a shell inside a container:

```powershell
docker exec -it shopverse-user-service sh
```

Check service log files inside a container:

```powershell
docker exec -it shopverse-user-service sh -c "ls -la /app/logs"
```

Refresh user-service config after Config Server changes:

```powershell
curl.exe -X POST http://localhost:8082/actuator/refresh `
  -H "Authorization: Bearer $token"
```

Stop the stack:

```powershell
docker compose down
```

Stop and delete volumes:

```powershell
docker compose down -v
```

Full local reset:

```powershell
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

Use `down -v` carefully because it deletes MySQL, Loki, Prometheus, Grafana, Jenkins, and service log volumes when used with their Compose files.

## MySQL Service Databases

The MySQL container provisions `order_service`, `inventory_service`, and
`payment_service` through `docker/mysql/init/01-create-service-databases.sh`.
The script grants access to the `MYSQL_USER` configured in `.env`; no local
developer username is embedded in it.

MySQL executes `/docker-entrypoint-initdb.d` only when its data directory is
created for the first time. An existing `mysql-data` volume will not rerun the
new script. For a disposable local POC, recreate the volume:

```powershell
docker compose down -v
docker compose up -d mysql
```

This deletes existing database, logging, and observability volumes. Preserve or
back up any data you need before using `-v`.

## Docker Command Flags

| Flag | Example | What it does |
| --- | --- | --- |
| `-f` | `docker compose -f jenkins/docker-compose.yml up -d` | Uses a specific Compose file instead of the default `docker-compose.yml`. |
| `-d` | `docker compose up -d` | Runs containers in detached/background mode. |
| `-t` | `docker build -t shopverse/user-service:local ./user-service` | Tags the built image with a name and tag. |
| `--build` | `docker compose up -d --build` | Builds images before starting containers. |
| `--force-recreate` | `docker compose up -d --force-recreate user-service` | Recreates containers even if Compose thinks nothing changed. |
| `--no-cache` | `docker compose build --no-cache` | Builds images without using cached Docker layers. |
| `-v` | `docker compose down -v` | Removes named volumes along with containers and networks. This deletes local persisted data. |
| `-p` | `docker run -p 8082:8082 ...` | Publishes container ports to the host. Format is `hostPort:containerPort`. |
| `-e` | `docker run -e DB_USERNAME=ahmed ...` | Passes an environment variable into a container. |
| `--rm` | `docker run --rm ...` | Automatically removes the container after it exits. |
| `-i` | `docker exec -it shopverse-user-service sh` | Keeps STDIN open for interactive commands. |
| `-t` with `exec` | `docker exec -it shopverse-user-service sh` | Allocates a pseudo-terminal so shell sessions work normally. |
| `--tail` | `docker compose logs --tail=100 user-service` | Shows only the last N log lines. |
| `--since` | `docker compose logs --since=10m user-service` | Shows logs newer than a time duration or timestamp. |

Notes:

- `docker compose` is the newer Docker Compose v2 command.
- `docker-compose` with a hyphen is the older standalone Compose command.

## Dockerfile Guide

Most Spring Boot services use the same multi-stage Dockerfile pattern.

| Dockerfile line | What it does |
| --- | --- |
| `# syntax=docker/dockerfile:1.7` | Enables Dockerfile frontend features such as BuildKit cache mounts. |
| `FROM eclipse-temurin:21-jdk-jammy AS build` | Starts the build stage with Java 21 JDK. The JDK is needed to compile and package the app. |
| `WORKDIR /workspace` | Sets `/workspace` as the working directory for later build-stage commands. |
| `COPY gradlew gradlew.bat settings.gradle build.gradle ./` | Copies Gradle wrapper and build metadata first so dependency layers can be cached. |
| `COPY gradle ./gradle` | Copies the Gradle wrapper files required by `./gradlew`. |
| `RUN chmod +x ./gradlew` | Makes the Linux Gradle wrapper executable inside the container. |
| `RUN --mount=type=cache,target=/root/.gradle ./gradlew dependencies --no-daemon` | Downloads dependencies using a BuildKit cache so future image builds are faster. |
| `COPY src ./src` | Copies application source code after dependencies, so source changes do not always invalidate dependency cache. |
| `RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon` | Builds the executable Spring Boot jar. |
| `FROM eclipse-temurin:21-jre-jammy AS runtime` | Starts a smaller runtime stage with Java 21 JRE only. The final image does not need the full JDK. |
| `ENV APP_HOME=/app ...` | Defines runtime defaults such as app directory, server port, and JVM memory options. Compose can override these values. |
| `WORKDIR ${APP_HOME}` | Sets `/app` as the working directory in the runtime image. |
| `RUN apt-get update ... curl ... groupadd ... useradd ...` | Installs `curl` for health checks, clears package cache, and creates a non-root `shopverse` user. |
| `COPY --from=build /workspace/build/libs/*.jar app.jar` | Copies only the built jar from the build stage into the final runtime image. |
| `RUN mkdir -p ${APP_HOME}/logs && chown -R shopverse:shopverse ${APP_HOME}` | Creates the log directory and gives the non-root user ownership. |
| `USER shopverse` | Runs the application as a non-root user for safer container runtime behavior. |
| `EXPOSE <port>` | Documents the container port used by the service. Compose still controls host port publishing. |
| `HEALTHCHECK ... curl ... /actuator/health` | Lets Docker check whether the Spring Boot app is healthy. |
| `ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]` | Starts the Spring Boot jar and allows `JAVA_OPTS` from environment variables. |

## RUN, CMD, And ENTRYPOINT

These three Dockerfile instructions are easy to mix up because all of them look like commands, but they run at different times.

| Instruction | When it runs | Purpose |
| --- | --- | --- |
| `RUN` | During `docker build` | Creates image layers. Use it to install packages, build the jar, create folders, or set file permissions. |
| `ENTRYPOINT` | When a container starts | Defines the main executable for the container. In our services, it starts the Spring Boot app. |
| `CMD` | When a container starts | Provides default arguments for `ENTRYPOINT`, or acts as the startup command if no `ENTRYPOINT` exists. |

### RUN

Example from our service Dockerfiles:

```dockerfile
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon
```

This runs while the image is being built. It compiles the Spring Boot app and creates the jar. After the image is built, this command does not run again unless the image is rebuilt.

Another example:

```dockerfile
RUN mkdir -p ${APP_HOME}/logs \
    && chown -R shopverse:shopverse ${APP_HOME}
```

This creates `/app/logs` and fixes ownership inside the image before runtime.

### ENTRYPOINT

Example from our service Dockerfiles:

```dockerfile
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

This runs when the container starts. For example:

```powershell
docker compose up -d order-service
```

Docker starts the `order-service` container and runs:

```sh
java $JAVA_OPTS -jar app.jar
```

We use `sh -c` because `JAVA_OPTS` is an environment variable. The shell expands it before Java starts.

### CMD

`CMD` is not currently used in the Spring Boot service Dockerfiles because `ENTRYPOINT` is enough for our POC.

A common pattern is:

```dockerfile
ENTRYPOINT ["java"]
CMD ["-jar", "app.jar"]
```

In that pattern:

- `ENTRYPOINT` says the container always runs `java`.
- `CMD` gives default arguments.
- A user can override `CMD` more easily at `docker run` time.

Our current pattern is simpler:

```dockerfile
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

That is good for this POC because each service container has exactly one job: run the Spring Boot jar.

### Runtime Flow In Shopverse

When we run:

```powershell
docker compose up -d order-service
```

Docker does roughly this:

1. Creates a container from `shopverse/order-service:local`.
2. Applies Compose environment variables such as `SERVER_PORT`, `SPRING_CONFIG_IMPORT`, `JWK_SET_URI`, `ZIPKIN_ENDPOINT`, and `LOG_FILE`.
3. Mounts configured volumes such as `/app/logs`.
4. Connects the container to the `shopverse` network.
5. Runs the Dockerfile `ENTRYPOINT`.
6. Starts the Spring Boot app.
7. Runs the Docker `HEALTHCHECK` until `/actuator/health` returns `UP`.

## Efficient Image Builds In Shopverse

Shopverse service images are built efficiently using a few practical Docker patterns.

### Multi-Stage Builds

Each service Dockerfile has a build stage and a runtime stage:

```dockerfile
FROM eclipse-temurin:21-jdk-jammy AS build
...
FROM eclipse-temurin:21-jre-jammy AS runtime
```

The build stage has the full JDK and Gradle build tools. The runtime stage has only the JRE and the built jar.

Why this matters:

- Final images are smaller.
- Build tools are not shipped in runtime containers.
- The runtime image has fewer moving parts.

### Dependency Layer Caching

The Dockerfile copies Gradle files before source code:

```dockerfile
COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
RUN --mount=type=cache,target=/root/.gradle ./gradlew dependencies --no-daemon
COPY src ./src
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon
```

This is intentional. Dependency downloads only need to rerun when Gradle files change. If only Java source changes, Docker can reuse the dependency layer.

### BuildKit Gradle Cache

These lines use BuildKit cache mounts:

```dockerfile
RUN --mount=type=cache,target=/root/.gradle ./gradlew dependencies --no-daemon
RUN --mount=type=cache,target=/root/.gradle ./gradlew bootJar --no-daemon
```

The Gradle cache is kept outside normal image layers. This makes repeated builds faster without copying the whole Gradle cache into the final image.

### Small Runtime Image

Only the jar is copied from the build stage:

```dockerfile
COPY --from=build /workspace/build/libs/*.jar app.jar
```

The final image does not include:

- source code
- Gradle wrapper cache
- Gradle build directories from the build stage
- JDK compiler tools

### Non-Root Runtime User

Each Spring Boot service container creates and uses a dedicated Linux user named `shopverse`:

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system shopverse \
    && useradd --system --gid shopverse --home-dir ${APP_HOME} --shell /usr/sbin/nologin shopverse

RUN mkdir -p ${APP_HOME}/logs \
    && chown -R shopverse:shopverse ${APP_HOME}

USER shopverse
```

By default, many container base images run as `root`. Root inside a container is still powerful inside that container. If an attacker ever abuses an application vulnerability, running as root gives the compromised process more permissions than it needs.

In Shopverse, the Spring Boot app only needs to:

- read `app.jar`
- read environment variables
- open the application port
- write logs to `/app/logs`
- call other services over the Docker network

It does not need root privileges.

Line-by-line:

| Line | What it does |
| --- | --- |
| `groupadd --system shopverse` | Creates a system group named `shopverse`. System groups are meant for services, not human login users. |
| `useradd --system --gid shopverse ... shopverse` | Creates a system user named `shopverse` and puts it in the `shopverse` group. |
| `--home-dir ${APP_HOME}` | Sets the user's home directory to `/app`, matching where the service jar runs. |
| `--shell /usr/sbin/nologin` | Prevents this user from being used as an interactive login shell user. |
| `mkdir -p ${APP_HOME}/logs` | Creates `/app/logs`, where Spring Boot writes file logs. |
| `chown -R shopverse:shopverse ${APP_HOME}` | Gives the `shopverse` user and group ownership of `/app`, including `app.jar` and `/app/logs`. |
| `USER shopverse` | Makes all following runtime commands, including `ENTRYPOINT`, run as the non-root `shopverse` user. |

This means our final startup command:

```dockerfile
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

runs as `shopverse`, not as `root`.

Why this matters:

- Limits damage if the application process is compromised.
- Prevents accidental writes to root-owned locations inside the container.
- Matches a production-grade container practice.
- Still allows the app to write logs because `/app` is owned by `shopverse`.

Important detail: if we create `/app/logs` but forget `chown`, the service may fail to write log files because it no longer runs as root. That is why our Dockerfiles create the log directory and then assign ownership before `USER shopverse`.

You can verify the runtime user:

```powershell
docker compose up -d order-service
docker exec -it shopverse-order-service sh -c "id && whoami && ls -ld /app /app/logs"
```

Expected result:

```text
uid=<number>(shopverse) gid=<number>(shopverse)
shopverse
/app and /app/logs owned by shopverse
```

The same pattern is used by the Spring Boot service images such as:

- `api-gateway`
- `config-server`
- `discovery-server`
- `auth-service`
- `user-service`
- `order-service`
- `payment-service`
- `inventory-service`

### Log Volume Friendly

Each service writes logs to `/app/logs`:

```dockerfile
RUN mkdir -p ${APP_HOME}/logs
```

Compose mounts named volumes there, and Promtail reads those files for centralized logging.

### When To Use No Cache

Most of the time, use:

```powershell
docker compose build
```

Use this only when you suspect stale layers or dependency cache problems:

```powershell
docker compose build --no-cache
```

`--no-cache` is slower because Docker rebuilds every layer.

The Jenkins Dockerfile is different because it builds a Jenkins controller image.

| Dockerfile line | What it does |
| --- | --- |
| `FROM jenkins/jenkins:lts-jdk21` | Starts from the official Jenkins LTS image with JDK 21. |
| `COPY plugins.txt /usr/share/ref/plugins.txt` | Copies the plugin list into Jenkins reference config. |
| `RUN jenkins-plugin-cli --plugin-file /usr/share/ref/plugins.txt` | Installs Jenkins plugins during image build. |
| `USER root` | Temporarily switches to root so Linux packages can be installed. |
| `RUN apt-get update ... docker ... git ...` | Installs Docker CLI, buildx, Compose, and Git so Jenkins jobs can build images and pull code. |
| `COPY init.groovy.d/ /usr/share/ref/init.groovy.d/` | Copies Jenkins startup Groovy scripts, including local POC admin setup. |
| `USER jenkins` | Switches back to the normal Jenkins user for runtime. |

## Config Server Compose Block

This is the Config Server service from the root `docker-compose.yml`:

```yaml
config-server:
  build:
    context: ./config-server
  image: shopverse/config-server:local
  container_name: shopverse-config-server
  environment:
    SERVER_PORT: 8888
    SPRING_PROFILES_ACTIVE: native
    CONFIG_SEARCH_LOCATIONS: file:/config
    LOG_FILE: /app/logs/config-server.log
  ports:
    - "8888:8888"
  volumes:
    - config-server-logs:/app/logs
    - ./cloud-configs:/config:ro
  healthcheck:
    test: ["CMD-SHELL", "curl -fsS http://localhost:8888/actuator/health | grep -q UP"]
    interval: 15s
    timeout: 5s
    retries: 15
    start_period: 90s
  networks:
    - shopverse
```

Line-by-line explanation:

| Line | Meaning |
| --- | --- |
| `config-server:` | Defines one Docker Compose service named `config-server`. Other services can reach it by this DNS name inside the `shopverse` network. |
| `build:` | Tells Compose this service can be built from a local Dockerfile. |
| `context: ./config-server` | Uses the `config-server/` folder as the Docker build context. Files outside this context are not sent to the image build. |
| `image: shopverse/config-server:local` | Names and tags the built image. Compose also uses this image name when starting the container. |
| `container_name: shopverse-config-server` | Gives the running container a predictable name instead of a generated Compose name. |
| `environment:` | Starts the list of environment variables passed into the Config Server container. |
| `SERVER_PORT: 8888` | Runs Config Server on port `8888` inside the container. |
| `SPRING_PROFILES_ACTIVE: native` | Enables Spring Cloud Config's native backend, so config is read from mounted local files instead of Git. |
| `CONFIG_SEARCH_LOCATIONS: file:/config` | Points Config Server to `/config`, where Compose mounts the local `cloud-configs/` folder. |
| `LOG_FILE: /app/logs/config-server.log` | Makes Spring Boot write Config Server logs to this file inside the container. Promtail reads this through a Docker volume. |
| `ports:` | Starts the host-to-container port mapping section. |
| `"8888:8888"` | Publishes container port `8888` to host port `8888`, so the Config Server is reachable at `http://localhost:8888`. |
| `volumes:` | Starts the volume mount section. |
| `config-server-logs:/app/logs` | Mounts a named Docker volume at `/app/logs` so logs survive container recreation unless the volume is deleted. |
| `./cloud-configs:/config:ro` | Mounts the local `cloud-configs/` folder into the container at `/config` as read-only. |
| `healthcheck:` | Defines how Docker decides whether Config Server is healthy. Other services can wait for this before starting. |
| `test: [...]` | Runs a shell command inside the container. It calls `/actuator/health` and checks for `UP`. |
| `CMD-SHELL` | Executes the healthcheck command through a shell, allowing the `| grep -q UP` pipe. |
| `curl -fsS` | Calls the health endpoint. `-f` fails on HTTP errors, `-sS` stays quiet but still shows errors. |
| `grep -q UP` | Checks that the health response contains `UP`; `-q` means quiet mode. |
| `interval: 15s` | Runs the healthcheck every 15 seconds after startup begins. |
| `timeout: 5s` | Marks a healthcheck attempt as failed if it takes longer than 5 seconds. |
| `retries: 15` | Allows up to 15 failed attempts before the container is considered unhealthy. |
| `start_period: 90s` | Gives Config Server up to 90 seconds of startup grace before failed checks count against retries. |
| `networks:` | Starts the list of Docker networks this service joins. |
| `shopverse` | Joins the shared `shopverse` network so other services can reach `http://config-server:8888`. |
