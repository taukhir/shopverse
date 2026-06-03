# Shopverse Docker Guide

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
curl.exe -X POST http://localhost:8082/actuator/refresh
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
