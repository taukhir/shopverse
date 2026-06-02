# Shopverse Jenkins

This folder contains the local Jenkins setup for the Shopverse POC.

Official Jenkins references:

- [Using a Jenkinsfile](https://www.jenkins.io/doc/book/pipeline/jenkinsfile/)
- [Pipeline syntax](https://www.jenkins.io/doc/book/pipeline/syntax/)
- [Pipeline as Code](https://www.jenkins.io/doc/book/pipeline/pipeline-as-code/)

## What Jenkins Does

Jenkins is a CI/CD automation server. In this POC, we use it to demonstrate how a team can build and test all microservices from one pipeline, build Docker images, optionally push images to a registry, and optionally run local Docker Compose smoke tests.

GitHub Actions already gives us hosted CI/CD. Jenkins gives us a local or company-hosted CI/CD option where we control the machine, Docker daemon, build cache, installed tools, and deployment access.

## Files

```text
jenkins/
  Dockerfile
  Jenkinsfile
  README.md
  docker-compose.yml
  plugins.txt
  init.groovy.d/01-basic-security.groovy
```

| File | Purpose |
| --- | --- |
| `Dockerfile` | Builds a Jenkins image with JDK 21, Docker CLI, buildx, Docker Compose, Git, and required Jenkins plugins. |
| `docker-compose.yml` | Runs Jenkins locally on port `8085` and mounts the Shopverse repo plus Docker socket. |
| `Jenkinsfile` | Defines the Shopverse CI pipeline. |
| `plugins.txt` | Jenkins plugins installed during image build. |
| `init.groovy.d/01-basic-security.groovy` | Creates the local admin user and disables first-run setup wizard. |

## Start Jenkins

From the Shopverse root folder:

```powershell
docker compose -f jenkins/docker-compose.yml build
docker compose -f jenkins/docker-compose.yml up -d
```

Open Jenkins:

```text
http://localhost:8085
```

Default local login:

```text
admin / admin
```

Check logs:

```powershell
docker compose -f jenkins/docker-compose.yml logs -f jenkins
```

Stop Jenkins:

```powershell
docker compose -f jenkins/docker-compose.yml down
```

Reset Jenkins data:

```powershell
docker compose -f jenkins/docker-compose.yml down -v
```

Use `down -v` carefully because it deletes the Jenkins home volume.

## Create The Jenkins Pipeline Job

1. Open `http://localhost:8085`.
2. Login with `admin / admin`.
3. Click **New Item**.
4. Enter a name like `shopverse`.
5. Select **Pipeline**.
6. Under **Pipeline**, choose **Pipeline script from SCM**.
7. Select **Git**.
8. Add your Shopverse GitHub repository URL.
9. Set **Branch Specifier** to your branch, for example `*/main`.
10. Set **Script Path** to:

```text
jenkins/Jenkinsfile
```

11. Save.
12. Run **Build with Parameters**.

For a local mounted workspace smoke run, you can also create a pipeline job with an inline script, but the preferred POC setup is `Pipeline script from SCM` so Jenkins checks out the latest code from GitHub.

## Create A User-Service Pipeline Job

Use this when you want a focused Jenkins job that only builds and packages `user-service`.

### Option 1: Pipeline From SCM

1. Open `http://localhost:8085`.
2. Login with `admin / admin`.
3. Click **New Item**.
4. Enter:

```text
shopverse-user-service
```

5. Select **Pipeline**.
6. Click **OK**.
7. Under **Pipeline**, select **Pipeline script from SCM**.
8. Select **Git**.
9. Add your Shopverse GitHub repository URL.
10. Set **Branch Specifier** to your branch, for example:

```text
*/main
```

11. Set **Script Path** to:

```text
jenkins/Jenkinsfile
```

12. Save.
13. Click **Build with Parameters**.
14. Use:

```text
BUILD_DOCKER_IMAGES=true
RUN_COMPOSE_SMOKE_TEST=false
PUSH_DOCKER_IMAGES=false
IMAGE_NAMESPACE=shopverse
```

The shared `jenkins/Jenkinsfile` builds all services. For a real team setup, this is the preferred job because a change in `user-service` is still validated against the full microservices POC.

### Option 2: One-Service Inline Pipeline

Use this for a quick POC demo where you only want to build `user-service`.

1. Open `http://localhost:8085`.
2. Click **New Item**.
3. Enter:

```text
shopverse-user-service-image
```

4. Select **Pipeline**.
5. Click **OK**.
6. Under **Pipeline**, choose **Pipeline script**.
7. Paste:

```groovy
pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        IMAGE_NAME = 'shopverse/user-service:jenkins-user-service'
    }

    stages {
        stage('Checkout Latest Code') {
            steps {
                dir('/workspace/shopverse') {
                    sh 'git -c safe.directory=/workspace/shopverse fetch --all --prune'
                    sh 'git -c safe.directory=/workspace/shopverse pull --ff-only'
                }
            }
        }

        stage('Build And Test User Service') {
            steps {
                dir('/workspace/shopverse/user-service') {
                    sh 'chmod +x ./gradlew'
                    sh './gradlew clean build --no-daemon'
                }
            }
        }

        stage('Build User Service Docker Image') {
            steps {
                dir('/workspace/shopverse') {
                    sh 'docker build -t ${IMAGE_NAME} ./user-service'
                }
            }
        }

        stage('Verify Image') {
            steps {
                sh 'docker image inspect ${IMAGE_NAME}'
            }
        }
    }
}
```

8. Save.
9. Click **Build Now**.

This demo pipeline does four things:

| Stage | What it does |
| --- | --- |
| `Checkout Latest Code` | Pulls the latest code from GitHub in the mounted Shopverse workspace. |
| `Build And Test User Service` | Runs `./gradlew clean build --no-daemon` inside `user-service`. |
| `Build User Service Docker Image` | Builds `shopverse/user-service:jenkins-user-service`. |
| `Verify Image` | Confirms the image exists in Docker. |

Verify from PowerShell:

```powershell
docker image inspect shopverse/user-service:jenkins-user-service
```

## Pipeline Parameters

| Parameter | Default | Use |
| --- | --- | --- |
| `BUILD_DOCKER_IMAGES` | `true` | Builds Docker images after Gradle build/test. |
| `RUN_COMPOSE_SMOKE_TEST` | `false` | Starts the full stack and verifies health endpoints. |
| `PUSH_DOCKER_IMAGES` | `false` | Pushes images to a registry. |
| `IMAGE_REGISTRY` | empty | Optional registry host, for example `ghcr.io`. |
| `IMAGE_NAMESPACE` | `shopverse` | Image namespace or owner/repo path. |
| `IMAGE_TAG` | auto | Optional fixed image tag. |
| `DOCKER_CREDENTIALS_ID` | empty | Optional Jenkins username/password credential for Docker login. |

## Jenkinsfile Syntax Used In Shopverse

The Shopverse Jenkinsfiles use Declarative Pipeline syntax. This keeps the pipeline readable and gives Jenkins a predictable structure.

### `pipeline`

Top-level block for a Declarative Pipeline:

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh './gradlew build'
            }
        }
    }
}
```

Everything Jenkins runs is defined inside this block.

### `agent any`

Tells Jenkins where the pipeline can run:

```groovy
agent any
```

`any` means Jenkins can run the job on any available executor. In our Dockerized local setup, that means the Jenkins controller container itself runs the pipeline.

### `options`

Defines pipeline-level behavior:

```groovy
options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
}
```

| Option | What it does |
| --- | --- |
| `disableConcurrentBuilds()` | Prevents two builds of the same Jenkins job from running at the same time. This avoids Docker tag conflicts and Compose stack conflicts. |
| `buildDiscarder(logRotator(numToKeepStr: '10'))` | Keeps only the latest 10 Jenkins build records for that job. This prevents Jenkins history from growing forever in the local volume. |

### `parameters`

Defines inputs shown in **Build with Parameters**:

```groovy
parameters {
    booleanParam(name: 'BUILD_DOCKER_IMAGE', defaultValue: true, description: 'Build the order-service Docker image.')
    string(name: 'IMAGE_TAG', defaultValue: '', description: 'Optional Docker image tag.')
}
```

| Parameter type | Example | What it does |
| --- | --- | --- |
| `booleanParam` | `BUILD_DOCKER_IMAGE` | Creates a true/false checkbox. |
| `string` | `IMAGE_TAG` | Creates a text input. |

In our pipelines, parameters let you decide whether to build Docker images, push images, run Compose smoke tests, and override image names/tags.

### `environment`

Defines environment variables available to all stages:

```groovy
environment {
    DOCKER_BUILDKIT = '1'
    COMPOSE_DOCKER_CLI_BUILD = '1'
}
```

| Variable | Why we use it |
| --- | --- |
| `DOCKER_BUILDKIT=1` | Enables Docker BuildKit. Required because our service Dockerfiles use `RUN --mount=type=cache`. |
| `COMPOSE_DOCKER_CLI_BUILD=1` | Makes Docker Compose use the Docker CLI builder behavior. |
| `COMPOSE_PROJECT_NAME=shopverse` | Keeps Compose project naming consistent for the shared stack pipeline. |

### `stages` And `stage`

`stages` is the list of major pipeline phases. Each `stage` is one visible block in Jenkins UI:

```groovy
stages {
    stage('Checkout') {
        steps {
            checkout scm
        }
    }
}
```

Examples in Shopverse:

```text
Checkout
Build And Test
Build Docker Image
Verify Docker Image
Docker Compose Smoke Test
```

### `steps`

Contains the actual work Jenkins runs inside a stage:

```groovy
steps {
    sh 'docker build -t "${ORDER_SERVICE_IMAGE}" ./order-service'
}
```

Common step types we use:

| Step | What it does |
| --- | --- |
| `checkout scm` | Checks out source code from the Git SCM configured in the Jenkins job. |
| `sh` | Runs a shell command on Linux/macOS agents. |
| `bat` | Runs a Windows batch command on Windows agents. |
| `powershell` | Runs PowerShell commands on Windows agents. |
| `dir('path')` | Runs nested steps inside a specific directory. |
| `echo` | Prints a message into the Jenkins console log. |

### `script`

Allows small pieces of Groovy logic inside a Declarative Pipeline:

```groovy
script {
    def shortSha = env.GIT_COMMIT ? env.GIT_COMMIT.take(8) : 'local'
    env.RESOLVED_IMAGE_TAG = params.IMAGE_TAG?.trim() ?: "${env.BUILD_NUMBER}-${shortSha}"
}
```

We use `script` when simple pipeline syntax is not enough, for example:

- calculating image tags
- looping over services
- building a `parallel` map
- choosing Linux vs Windows commands

### `when`

Controls whether a stage should run:

```groovy
when {
    expression { params.BUILD_DOCKER_IMAGE }
}
```

This means:

```text
Run this stage only when BUILD_DOCKER_IMAGE is true.
```

In `order-service/Jenkinsfile`, the Docker image stages are skipped when `BUILD_DOCKER_IMAGE=false`.

In the shared `jenkins/Jenkinsfile`, examples include:

```groovy
when {
    expression { params.BUILD_DOCKER_IMAGES }
}
```

```groovy
when {
    expression { params.RUN_COMPOSE_SMOKE_TEST }
}
```

These let the same pipeline run as either a Gradle-only build, a Docker-image build, or a full Compose smoke test.

### `post`

Runs cleanup or reporting steps after a stage or pipeline finishes:

```groovy
post {
    always {
        junit allowEmptyResults: true, testResults: 'order-service/build/test-results/test/*.xml'
        archiveArtifacts allowEmptyArchive: true, artifacts: 'order-service/build/reports/tests/test/**'
    }
}
```

`always` means Jenkins runs these steps whether the stage passed or failed.

### `junit`

Publishes JUnit XML test results in Jenkins:

```groovy
junit allowEmptyResults: true, testResults: 'order-service/build/test-results/test/*.xml'
```

| Part | Meaning |
| --- | --- |
| `testResults` | Glob path to JUnit XML files. |
| `allowEmptyResults: true` | Does not fail the pipeline if no test result files exist. Useful for early POC stages. |

### `archiveArtifacts`

Saves files from the workspace as Jenkins build artifacts:

```groovy
archiveArtifacts allowEmptyArchive: true, artifacts: 'order-service/build/reports/tests/test/**'
```

We use it to keep Gradle HTML test reports available from the Jenkins build page.

### `parallel`

Runs multiple branches at the same time:

```groovy
script {
    def branches = [:]
    services.each { service ->
        branches[service] = {
            gradleBuild(service)
        }
    }
    parallel branches
}
```

The shared pipeline uses this to build and test all services faster.

### Helper Methods

The shared `jenkins/Jenkinsfile` defines helper methods before the `pipeline` block:

```groovy
def runCommand(String unixCommand, String windowsCommand = null) {
    if (isUnix()) {
        sh unixCommand
    } else {
        bat(windowsCommand ?: unixCommand)
    }
}
```

| Helper | Purpose |
| --- | --- |
| `runCommand` | Runs Linux shell commands on Linux agents and batch commands on Windows agents. |
| `gradleBuild` | Runs `clean build` for one service. |
| `imageName` | Builds a consistent Docker image name from registry, namespace, service, and tag. |

The `order-service/Jenkinsfile` does not use helpers because it is intentionally simple and service-specific.

## Pipeline Stages

### 1. Checkout Latest Code

Jenkins checks out the latest source from the configured Git SCM. If the job is run from a locally mounted workspace without SCM, it falls back to:

```text
git fetch --all --prune
git pull --ff-only
```

This keeps the build input aligned with the latest GitHub code.

### 2. Initialize

The pipeline creates a Docker image tag. If `IMAGE_TAG` is not provided, it uses:

```text
<jenkins-build-number>-<short-git-sha>
```

### 3. Validate Repository

The pipeline checks that required files exist, including:

```text
docker-compose.yml
cloud-configs/*.yml
observability/prometheus-docker.yml
observability/promtail.yml
observability/loki.yml
```

This catches missing config before spending time on builds.

### 4. Build And Test Services

All services are built and tested in parallel:

```text
config-server
discovery-server
user-service
auth-service
order-service
payment-service
inventory-service
api-gateway
```

Each service runs:

```text
./gradlew clean build --no-daemon
```

Jenkins also collects JUnit test reports and archives test report HTML folders when present.

### 5. Build Docker Images

When `BUILD_DOCKER_IMAGES=true`, Jenkins builds one Docker image per service:

```text
docker build -t <image-name> ./<service>
```

BuildKit is enabled because the service Dockerfiles use cache mounts.

Example image:

```text
shopverse/config-server:<build-number>-<git-sha>
```

### 6. Push Docker Images

When `PUSH_DOCKER_IMAGES=true`, Jenkins optionally logs in using `DOCKER_CREDENTIALS_ID` and pushes every built service image.

For GHCR, use:

```text
IMAGE_REGISTRY=ghcr.io
IMAGE_NAMESPACE=<owner>/<repo>
```

### 7. Docker Compose Smoke Test

When `RUN_COMPOSE_SMOKE_TEST=true`, Jenkins starts the full local stack:

```text
docker compose up -d --build
```

Then it verifies service health endpoints plus public order, payment, and inventory APIs. If the smoke test fails, Jenkins prints `docker compose ps` and recent logs. The authenticated checkout SAGA can be tested manually with a bearer token after the stack starts.

## One-Service Build Demo

We tested Jenkins with a small one-service smoke pipeline that built:

```text
shopverse/config-server:jenkins-api-smoke
```

That confirms Jenkins can:

1. Access the Shopverse workspace.
2. Use Docker from inside the Jenkins container.
3. Use BuildKit/buildx.
4. Build a service image successfully.

The full `jenkins/Jenkinsfile` uses the same Docker path, but applies it to every Shopverse service.

## Useful Commands

Verify Jenkins is running:

```powershell
docker compose -f jenkins/docker-compose.yml ps
```

Verify Jenkins can access Docker:

```powershell
docker exec shopverse-jenkins docker version
docker exec shopverse-jenkins docker buildx version
docker exec shopverse-jenkins docker compose version
```

Build one image from inside Jenkins:

```powershell
docker exec shopverse-jenkins sh -c "cd /workspace/shopverse && DOCKER_BUILDKIT=1 docker build -t shopverse/config-server:jenkins-smoke ./config-server"
```

Check the image:

```powershell
docker image inspect shopverse/config-server:jenkins-smoke
```

## Notes

- Jenkins runs on host port `8085` because the API Gateway uses `8080`.
- The Jenkins container mounts `/var/run/docker.sock`, so it can build images on the host Docker daemon.
- A clean Jenkins image build needs internet access to `updates.jenkins.io` for plugin installation.
- The local default password is only for the POC. Use a stronger password outside local demos.
