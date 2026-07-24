---
title: Kubernetes kubectl Commands, YAML, JSON, And API Configuration
description: Operational kubectl handbook covering contexts, discovery, Pods and containers, workloads, networking, storage, RBAC, JSON output, JSONPath, patches, declarative apply, and safe diagnosis.
difficulty: Intermediate
page_type: Reference
status: Generic
prerequisites: [Kubernetes workload fundamentals]
learning_objectives: [Operate Kubernetes safely with kubectl, Read and author YAML and JSON API objects, Query and patch structured output, Diagnose workloads without losing evidence]
technologies: [Kubernetes, kubectl, YAML, JSON, JSONPath, Helm]
last_reviewed: "2026-07-24"
---

# Kubernetes kubectl Commands, YAML, JSON, And API Configuration

`kubectl` is an API client. It reads kubeconfig, selects a context, authenticates to
the API server, sends Kubernetes API requests, and formats the response. A command
that returns successfully may only mean desired state was accepted; controllers and
kubelets still need to converge the system.

## Safety Before Every Command

```bash
kubectl config current-context
kubectl config get-contexts
kubectl cluster-info
kubectl auth whoami
kubectl get namespace
```

Specify context and namespace in automation rather than depending on ambient state:

```bash
kubectl --context prod-eu -n orders get deploy
```

Before a write, ask:

- Is this the intended cluster and namespace?
- Is the object GitOps/Helm/controller owned?
- Will a manual edit be overwritten by reconciliation?
- Is there a reviewed manifest and rollback path?
- Does the command reveal a Secret in terminal history or logs?

## API Discovery And Schema

```bash
kubectl api-resources
kubectl api-versions
kubectl explain deployment
kubectl explain deployment.spec.template.spec.containers --recursive
kubectl get --raw /version
kubectl get --raw='/readyz?verbose'
```

Use discovery rather than guessing API group, resource name, or field shape. CRDs
extend discovery and OpenAPI, but their controllers supply the behavior.

## Kubernetes Objects Are JSON API Documents

YAML is an authoring representation. The Kubernetes API exchanges structured JSON,
and YAML manifests are converted into the same object model.

### YAML Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: orders
  namespace: shopverse
  labels:
    app.kubernetes.io/name: orders
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: orders
  template:
    metadata:
      labels:
        app.kubernetes.io/name: orders
    spec:
      containers:
        - name: app
          image: registry.example/orders@sha256:REPLACE
          ports:
            - name: http
              containerPort: 8080
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              memory: 768Mi
```

### Equivalent JSON Shape

```json
{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "orders",
    "namespace": "shopverse",
    "labels": {"app.kubernetes.io/name": "orders"}
  },
  "spec": {
    "replicas": 3,
    "selector": {
      "matchLabels": {"app.kubernetes.io/name": "orders"}
    },
    "template": {
      "metadata": {
        "labels": {"app.kubernetes.io/name": "orders"}
      },
      "spec": {
        "containers": [{
          "name": "app",
          "image": "registry.example/orders@sha256:REPLACE",
          "ports": [{"name": "http", "containerPort": 8080}],
          "resources": {
            "requests": {"cpu": "250m", "memory": "512Mi"},
            "limits": {"memory": "768Mi"}
          }
        }]
      }
    }
  }
}
```

Both can be submitted with `kubectl apply -f`. JSON makes types explicit; YAML is
usually easier for humans but has indentation and scalar-coercion hazards. Quote
values when their string identity matters, and validate against the server schema.

## Desired State, Status, And Metadata

| Field | Meaning |
|---|---|
| `apiVersion` | API group and version used for the request |
| `kind` | object type |
| `metadata.name/namespace` | identity within API scope |
| labels | query and selector identity |
| annotations | non-identifying metadata |
| `spec` | desired state supplied by a user/controller |
| `status` | observed state reported by controllers/agents |
| `generation` | desired-state generation |
| `resourceVersion` | storage/watch concurrency token |
| `managedFields` | field ownership used by server-side apply |

Do not copy server-generated `status`, `resourceVersion`, `uid`, or noisy managed
fields into source manifests.

## Read And Inspect Objects

```bash
kubectl get pods -A
kubectl get pods -n shopverse -o wide
kubectl get pod orders-abc -n shopverse -o yaml
kubectl get pod orders-abc -n shopverse -o json
kubectl describe pod orders-abc -n shopverse
kubectl get events -n shopverse --sort-by=.metadata.creationTimestamp
kubectl get deploy,rs,pod -n shopverse -l app.kubernetes.io/name=orders
```

`get` shows structured current state. `describe` combines selected object state and
events for humans; do not parse its display format in automation.

## JSON Output, JSONPath, And Structured Automation

```bash
kubectl get pods -n shopverse -o json
kubectl get pods -n shopverse -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'
kubectl get pods -n shopverse -o custom-columns='NAME:.metadata.name,NODE:.spec.nodeName,PHASE:.status.phase'
kubectl get pod orders-abc -n shopverse -o jsonpath='{.status.containerStatuses[*].restartCount}'
```

With `jq` installed:

```bash
kubectl get pods -A -o json |
  jq -r '.items[] | select(.status.phase != "Running") |
         [.metadata.namespace, .metadata.name, .status.phase] | @tsv'
```

Prefer JSON plus a structured parser in scripts. Table columns and human messages
are not stable machine contracts.

## Create, Diff, Apply, And Wait

```bash
kubectl create namespace shopverse --dry-run=client -o yaml
kubectl apply --dry-run=server -f deployment.yaml
kubectl diff -f deployment.yaml
kubectl apply -f deployment.yaml
kubectl wait -n shopverse --for=condition=Available deployment/orders --timeout=180s
kubectl rollout status -n shopverse deployment/orders --timeout=180s
```

Client dry-run proves local generation. Server dry-run additionally exercises API
schema, defaulting, admission, authorization, and webhooks without persisting the
object. A successful apply is not readiness; wait on an explicit condition.

### Server-Side Apply

```bash
kubectl apply --server-side --field-manager=platform-gitops -f deployment.yaml
kubectl get deployment orders -n shopverse --show-managed-fields -o yaml
```

Server-side apply tracks field ownership. Conflicts mean another manager owns a
field; understand the ownership boundary before using `--force-conflicts`.

## Pods And Containers

```bash
kubectl get pod orders-abc -n shopverse -o wide
kubectl logs orders-abc -n shopverse -c app
kubectl logs orders-abc -n shopverse -c app --previous
kubectl logs -n shopverse -l app.kubernetes.io/name=orders --all-containers --prefix
kubectl exec -n shopverse orders-abc -c app -- printenv
kubectl top pod -n shopverse --containers
kubectl port-forward -n shopverse pod/orders-abc 18080:8080
kubectl cp -n shopverse orders-abc:/tmp/evidence.txt ./evidence.txt -c app
```

Use `--previous` for a restarted container. `exec` requires a suitable executable
inside the image; distroless images may need an approved ephemeral debug container:

```bash
kubectl debug -n shopverse pod/orders-abc -it --image=registry.example/debug-tools --target=app
```

Debug images are privileged operational tools. Pin, scan, authorize, and audit them.

## Deployment And Rollout Commands

```bash
kubectl get deployment,replicaset,pod -n shopverse
kubectl rollout status deployment/orders -n shopverse
kubectl rollout history deployment/orders -n shopverse
kubectl scale deployment/orders -n shopverse --replicas=5
kubectl rollout restart deployment/orders -n shopverse
kubectl rollout undo deployment/orders -n shopverse --to-revision=3
```

Manual scale/restart/undo can fight GitOps or HPA and cannot roll back database or
external side effects. Prefer updating the owning source of truth.

## Service, Endpoint, DNS, And Network Commands

```bash
kubectl get service,endpoints,endpointslice -n shopverse
kubectl describe service orders -n shopverse
kubectl get networkpolicy -n shopverse
kubectl run dns-check -n shopverse --rm -it --restart=Never \
  --image=registry.example/network-tools -- nslookup orders.shopverse.svc.cluster.local
kubectl port-forward -n shopverse service/orders 18080:80
```

A Service with no endpoints is usually a selector/readiness problem. Prove Pod IP
reachability, Service endpoint membership, DNS resolution, policy, and gateway/LB
paths separately.

## Configuration And Secrets

```bash
kubectl create configmap orders-config -n shopverse \
  --from-file=application.yaml --dry-run=client -o yaml
kubectl create secret generic orders-db -n shopverse \
  --from-literal=username=REPLACE --from-literal=password=REPLACE \
  --dry-run=client -o yaml
kubectl get configmap orders-config -n shopverse -o json
```

Do not pass real secrets on command lines: shell history, process listings, CI logs,
and audit systems may expose them. Kubernetes Secret values are base64-encoded, not
automatically encrypted. Use approved secret delivery and encryption controls.

## Storage Commands

```bash
kubectl get storageclass
kubectl get pvc,pv -A
kubectl describe pvc orders-data -n shopverse
kubectl get volumeattachment
kubectl get pod orders-abc -n shopverse -o jsonpath='{.spec.volumes}'
```

Separate scheduling/binding, CSI provisioning, attach, mount, filesystem, capacity,
topology, and application-permission failures.

## Nodes, Scheduling, And Capacity

```bash
kubectl get nodes -o wide
kubectl describe node worker-01
kubectl top node
kubectl get pods -A -o wide --field-selector spec.nodeName=worker-01
kubectl cordon worker-01
kubectl drain worker-01 --ignore-daemonsets --delete-emptydir-data=false
kubectl uncordon worker-01
```

Drain can block on PDBs, local data, or unmanaged Pods. Never add destructive flags
until the workload owner and data consequences are understood.

## RBAC And Identity

```bash
kubectl auth whoami
kubectl auth can-i get secrets -n shopverse
kubectl auth can-i --list -n shopverse
kubectl auth can-i create deployments -n shopverse --as=system:serviceaccount:shopverse:orders
kubectl get role,rolebinding,serviceaccount -n shopverse
kubectl get clusterrole,clusterrolebinding
```

`can-i` proves authorization evaluation for a request shape; it does not prove that
credentials are safe, admission will accept the object, or a downstream operation succeeds.

## Patching Structured Objects

### Merge Patch

```bash
kubectl patch deployment orders -n shopverse --type=merge \
  -p '{"spec":{"replicas":4}}'
```

### JSON Patch

```bash
kubectl patch deployment orders -n shopverse --type=json \
  -p='[{"op":"replace","path":"/spec/replicas","value":4}]'
```

JSON Patch is an ordered list of operations (`add`, `remove`, `replace`, `move`,
`copy`, `test`). Merge patch recursively merges objects but replaces lists. Strategic
merge understands selected Kubernetes list merge keys for built-in resources, but
is not universally available for CRDs. Prefer reviewed declarative source changes.

## Deletion And Finalizers

```bash
kubectl delete -f deployment.yaml
kubectl delete pod orders-abc -n shopverse --wait=true
kubectl get namespace shopverse -o jsonpath='{.spec.finalizers}'
kubectl get pvc orders-data -n shopverse -o jsonpath='{.metadata.finalizers}'
```

Deletion first sets a deletion timestamp. Finalizers can keep an object terminating
until its controller completes cleanup. Do not remove finalizers blindly; identify
the owner and external resource obligation first.

## Helm Command Bridge

```bash
helm lint ./chart
helm template orders ./chart -n shopverse -f values-prod.yaml
helm upgrade --install orders ./chart -n shopverse --create-namespace \
  -f values-prod.yaml --atomic --wait
helm list -A
helm status orders -n shopverse
helm history orders -n shopverse
helm get manifest orders -n shopverse
helm rollback orders 3 -n shopverse --wait
```

Helm renders and releases Kubernetes resources; it does not replace `kubectl` for
runtime diagnosis. Continue with the
[Helm, GitOps, And Argo CD path](../HELM-GITOPS-ARGOCD-PATH.md).

## Diagnostic Sequence

```text
context/identity -> object spec/status -> conditions -> events
-> controller/workload ownership -> Pod status -> current/previous logs
-> node/runtime/CNI/CSI -> network/storage/dependency evidence
```

Preserve evidence before deleting or restarting a failing Pod. Replacement can
erase the most useful previous logs, events, exit status, and node association.

## Official References

- [kubectl command reference](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes API concepts](https://kubernetes.io/docs/reference/using-api/api-concepts/)
- [Declarative object management](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/)
- [JSONPath support](https://kubernetes.io/docs/reference/kubectl/jsonpath/)
- [Server-side apply](https://kubernetes.io/docs/reference/using-api/server-side-apply/)

## Recommended Next

Continue with [Kubeconfig, Contexts, Authentication, And Cluster Access](./KUBERNETES-KUBECONFIG-ACCESS.md)
before tracing the request through Kubernetes control-plane internals.
