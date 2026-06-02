FROM jenkins/jenkins:lts-jdk21

COPY plugins.txt /usr/share/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/ref/plugins.txt

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        docker-buildx \
        docker-cli \
        docker.io \
        git \
    && (apt-get install -y --no-install-recommends docker-compose-plugin || apt-get install -y --no-install-recommends docker-compose) \
    && mkdir -p /usr/local/lib/docker/cli-plugins \
    && if command -v docker-compose >/dev/null 2>&1; then ln -sf "$(command -v docker-compose)" /usr/local/lib/docker/cli-plugins/docker-compose; fi \
    && rm -rf /var/lib/apt/lists/*

COPY init.groovy.d/ /usr/share/ref/init.groovy.d/

USER jenkins
