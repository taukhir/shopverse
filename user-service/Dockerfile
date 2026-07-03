# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace/user-service

COPY user-service/gradlew user-service/gradlew.bat user-service/settings.gradle user-service/build.gradle ./
COPY user-service/gradle ./gradle
COPY shopverse-platform ../shopverse-platform
RUN chmod +x ./gradlew

# Download dependencies first so Docker can cache them independently from source changes.
COPY user-service/src ./src
RUN --mount=type=cache,id=shopverse-user-service-gradle,target=/root/.gradle ./gradlew bootJar --no-daemon --max-workers=2

FROM eclipse-temurin:21-jre-alpine AS runtime

ENV APP_HOME=/app \
    SERVER_PORT=8082 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError"

WORKDIR ${APP_HOME}

RUN apk add --no-cache curl \
    && addgroup -S shopverse \
    && adduser -S -G shopverse -h ${APP_HOME} -s /sbin/nologin shopverse

COPY --chown=shopverse:shopverse --from=build /workspace/user-service/build/libs/*.jar app.jar

RUN mkdir -p ${APP_HOME}/logs \
    && chown shopverse:shopverse ${APP_HOME}/logs
USER shopverse

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["sh", "-c", "curl -fsS http://localhost:${SERVER_PORT}/actuator/health | grep -q UP"]

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
