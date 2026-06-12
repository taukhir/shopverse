# syntax=docker/dockerfile:1.7

FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace

COPY gradlew gradlew.bat settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x ./gradlew

COPY src ./src
RUN --mount=type=cache,id=shopverse-order-service-gradle,target=/root/.gradle ./gradlew bootJar --no-daemon --max-workers=2

FROM eclipse-temurin:21-jre-jammy AS runtime

ENV APP_HOME=/app \
    SERVER_PORT=8083 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseContainerSupport -XX:+ExitOnOutOfMemoryError"

WORKDIR ${APP_HOME}

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system shopverse \
    && useradd --system --gid shopverse --home-dir ${APP_HOME} --shell /usr/sbin/nologin shopverse

COPY --chown=shopverse:shopverse --from=build /workspace/build/libs/*.jar app.jar

RUN mkdir -p ${APP_HOME}/logs \
    && chown shopverse:shopverse ${APP_HOME}/logs
USER shopverse

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
  CMD ["sh", "-c", "curl -fsS http://localhost:${SERVER_PORT}/actuator/health | grep -q UP"]

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
