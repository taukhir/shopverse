# Shopverse Jenkins Runbook

This directory runs a local Jenkins LTS controller and contains the shared
Shopverse pipeline.

Detailed explanations of Declarative Pipeline syntax, every stage, conditional
execution, Docker builds, credentials, local deployment, and security
trade-offs are maintained in:

- [Shopverse Jenkins implementation](../documentation/docs/operations/SHOPVERSE-JENKINS.md)
- [Generic Jenkins reference](../documentation/docs/operations/JENKINS.md)
- [CI/CD automation](../documentation/docs/operations/CI-CD-AUTOMATION.md)

## Files

| File | Purpose |
|---|---|
| `Dockerfile` | Jenkins LTS image with JDK 21, Git, Docker CLI, Buildx, and Compose |
| `docker-compose.yml` | local Jenkins controller on port `8085` |
| `Jenkinsfile` | shared multi-service pipeline |
| `plugins.txt` | plugins installed during image build |
| `init.groovy.d` | local initialization scripts |

## Configure Credentials

Create the root `.env` if needed:

```powershell
Copy-Item .env.example .env
```

Set `JENKINS_ADMIN_USER` and `JENKINS_ADMIN_PASSWORD` in `.env`. The password
must not be hardcoded in this README, a Jenkinsfile, or source control.

## Start Jenkins

```powershell
docker compose -f jenkins/docker-compose.yml build
docker compose -f jenkins/docker-compose.yml up -d
docker compose -f jenkins/docker-compose.yml ps
docker compose -f jenkins/docker-compose.yml logs --tail=200 -f jenkins
```

Open `http://localhost:8085`.

## Create A Pipeline From SCM

1. Select **New Item**.
2. Enter a job name such as `shopverse-user-service`.
3. Select **Pipeline**.
4. Under **Pipeline**, choose **Pipeline script from SCM**.
5. Select **Git**.
6. Repository URL: `https://github.com/taukhir/shopverse.git`.
7. Branch specifier: `*/main`, or the branch being tested.
8. Script path:
   - shared pipeline: `jenkins/Jenkinsfile`
   - user service: `user-service/Jenkinsfile`
   - order service: `order-service/Jenkinsfile`
   - discovery server: `discovery-server/Jenkinsfile`
9. Save the job and run it once.

**Build with Parameters** appears after Jenkins has loaded a parameterized
Jenkinsfile at least once. If Jenkins reports that it cannot find a
Jenkinsfile, confirm the repository URL, branch, case-sensitive path, and that
the file is committed to the selected branch.

## Shared Pipeline Stages

The shared pipeline can perform:

1. checkout;
2. repository/config validation;
3. affected or selected service build and test;
4. JUnit report publication;
5. optional Docker image build;
6. optional registry push;
7. optional local Compose smoke deployment;
8. bounded diagnostics and cleanup.

Parameters decide whether image build, push, or local deployment stages run.
The exact parameter names and `when` expressions are documented in the
[implementation page](../documentation/docs/operations/SHOPVERSE-JENKINS.md).

## Build A Service Image

For a parameterized service job:

1. Open the job.
2. Select **Build with Parameters**.
3. Select the service and enable `BUILD_DOCKER_IMAGES` in the shared pipeline,
   or `BUILD_DOCKER_IMAGE` in a service-specific pipeline.
4. Leave registry push disabled for a local-only test.
5. Start the build.

Verify the result on the Docker host:

```powershell
docker image ls "shopverse/*"
docker inspect shopverse/user-service:local
```

## Local Deployment

The local Jenkins container mounts the host Docker socket so service-specific
pipeline commands can build and start containers:

```groovy
when {
    expression {
        params.BUILD_DOCKER_IMAGE && params.DEPLOY_LOCALLY
    }
}
steps {
    sh 'docker compose up -d --build user-service'
}
```

Mounting `docker.sock` effectively grants host-level Docker control. It is
acceptable only for this trusted local POC. Production Jenkins should use
isolated agents and narrowly scoped credentials.

## Useful Commands

```powershell
docker compose -f jenkins/docker-compose.yml restart jenkins
docker compose -f jenkins/docker-compose.yml logs --tail=200 jenkins
docker compose -f jenkins/docker-compose.yml down
docker compose -f jenkins/docker-compose.yml down -v
```

The final command removes Jenkins state, jobs, and plugin data stored in its
named volume.

## GitHub Actions Relationship

GitHub Actions is the repository-hosted CI path. Jenkins is the self-hosted
demonstration path. They should enforce equivalent build and test gates without
triggering each other in a loop.

See [GitHub Actions](../.github/workflows/README.md) for workflow-specific
details.
