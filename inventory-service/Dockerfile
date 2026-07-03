# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace/inventory-service

COPY inventory-service/gradlew inventory-service/gradlew.bat inventory-service/settings.gradle inventory-service/build.gradle ./
COPY inventory-service/gradle ./gradle
COPY shopverse-platform ../shopverse-platform
RUN chmod +x ./gradlew

COPY inventory-service/src ./src
RUN --mount=type=cache,id=shopverse-inventory-service-gradle,target=/root/.gradle ./gradlew bootJar --no-daemon --max-workers=2

FROM eclipse-temurin:21-jre-alpine AS runtime

ENV APP_HOME=/app \
    SERVER_PORT=8086 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError"

WORKDIR ${APP_HOME}

RUN apk add --no-cache curl \
    && addgroup -S shopverse \
    && adduser -S -G shopverse -h ${APP_HOME} -s /sbin/nologin shopverse

COPY --chown=shopverse:shopverse --from=build /workspace/inventory-service/build/libs/*.jar app.jar

RUN mkdir -p ${APP_HOME}/logs \
    && chown shopverse:shopverse ${APP_HOME}/logs
USER shopverse

EXPOSE 8086

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD ["sh", "-c", "curl -fsS http://localhost:${SERVER_PORT}/actuator/health | grep -q UP"]

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
