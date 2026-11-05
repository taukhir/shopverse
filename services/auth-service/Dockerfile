# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:25-jdk-jammy AS build
WORKDIR /workspace/services/auth-service

COPY services/auth-service/gradlew services/auth-service/gradlew.bat services/auth-service/settings.gradle services/auth-service/build.gradle ./
COPY services/auth-service/gradle ./gradle
COPY gradle ../../gradle
COPY build-logic ../../build-logic
COPY shopverse-common ../../shopverse-common
RUN chmod +x ./gradlew

COPY services/auth-service/src ./src
RUN --mount=type=cache,id=shopverse-auth-service-gradle,target=/root/.gradle ./gradlew bootJar --no-daemon --max-workers=2

FROM eclipse-temurin:25-jre-alpine AS runtime

ENV APP_HOME=/app \
    SERVER_PORT=8081 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError"

WORKDIR ${APP_HOME}

RUN apk add --no-cache --upgrade curl libexpat \
    && addgroup -S shopverse \
    && adduser -S -G shopverse -h ${APP_HOME} -s /sbin/nologin shopverse

COPY --chown=shopverse:shopverse --from=build /workspace/services/auth-service/build/libs/*.jar app.jar

RUN mkdir -p ${APP_HOME}/logs \
    && chown shopverse:shopverse ${APP_HOME}/logs
USER shopverse

EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD ["sh", "-c", "curl -fsS http://localhost:${SERVER_PORT}/actuator/health | grep -q UP"]

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
