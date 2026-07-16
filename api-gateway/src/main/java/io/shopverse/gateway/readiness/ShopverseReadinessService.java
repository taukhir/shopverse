package io.shopverse.gateway.readiness;

import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.ReactiveDiscoveryClient;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ShopverseReadinessService {

    private static final ParameterizedTypeReference<Map<String, Object>> MAP_RESPONSE =
            new ParameterizedTypeReference<>() {
            };
    private static final ParameterizedTypeReference<List<Map<String, Object>>> LIST_OF_MAP_RESPONSE =
            new ParameterizedTypeReference<>() {
            };

    private final ReactiveDiscoveryClient discoveryClient;
    private final RouteLocator routeLocator;
    private final ShopverseReadinessProperties properties;
    private final WebClient webClient;

    public ShopverseReadinessService(
            ReactiveDiscoveryClient discoveryClient,
            RouteLocator routeLocator,
            ShopverseReadinessProperties properties,
            WebClient.Builder webClientBuilder
    ) {
        this.discoveryClient = discoveryClient;
        this.routeLocator = routeLocator;
        this.properties = properties;
        this.webClient = webClientBuilder.build();
    }

    public Mono<ReadinessResponse> check() {
        Instant startedAt = Instant.now();

        return Mono.zip(
                        checkDiscovery(),
                        checkRoutes(),
                        checkDownstreamHealth(),
                        checkSeedCatalog()
                )
                .flatMap(tuple -> checkMinioFromCatalog(tuple.getT4()).map(minio -> {
                    Map<String, ReadinessCheck> checks = new LinkedHashMap<>();
                    checks.put("discovery", tuple.getT1());
                    checks.put("routes", tuple.getT2());
                    checks.put("downstreamHealth", tuple.getT3());
                    checks.put("seedCatalog", tuple.getT4());
                    checks.put("minioProductImages", minio);

                    boolean ready = checks.entrySet().stream()
                            .filter(entry -> !"minioProductImages".equals(entry.getKey()) || isMinioRequired())
                            .allMatch(entry -> entry.getValue().requiredReady());

                    return new ReadinessResponse(
                            ready ? ReadinessStatus.UP.name() : ReadinessStatus.DOWN.name(),
                            Instant.now(),
                            Duration.between(startedAt, Instant.now()).toMillis(),
                            checks
                    );
                }));
    }

    private Mono<ReadinessCheck> checkDiscovery() {
        return Flux.fromIterable(properties.requiredServices())
                .flatMap(service -> discoveryClient.getInstances(service)
                        .collectList()
                        .map(instances -> Map.entry(service, instances.size())))
                .collectList()
                .map(entries -> {
                    Map<String, Object> instanceCounts = entries.stream()
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    Map.Entry::getValue,
                                    (left, right) -> left,
                                    LinkedHashMap::new
                            ));
                    List<String> missing = entries.stream()
                            .filter(entry -> entry.getValue() <= 0)
                            .map(Map.Entry::getKey)
                            .toList();

                    if (!missing.isEmpty()) {
                        return ReadinessCheck.down("Required services are missing from discovery.", Map.of(
                                "missingServices", missing,
                                "instanceCounts", instanceCounts
                        ));
                    }

                    return ReadinessCheck.up("All required services are registered in discovery.", Map.of(
                            "instanceCounts", instanceCounts
                    ));
                })
                .timeout(properties.timeout())
                .onErrorResume(error -> Mono.just(ReadinessCheck.down(
                        "Discovery check failed.",
                        Map.of("error", safeMessage(error))
                )));
    }

    private Mono<ReadinessCheck> checkRoutes() {
        return routeLocator.getRoutes()
                .map(route -> route.getId())
                .collect(Collectors.toCollection(java.util.LinkedHashSet::new))
                .map(routeIds -> {
                    List<String> missing = properties.requiredRouteIds().stream()
                            .filter(routeId -> !routeIds.contains(routeId))
                            .toList();
                    if (!missing.isEmpty()) {
                        return ReadinessCheck.down("Required gateway routes are missing.", Map.of(
                                "missingRouteIds", missing,
                                "availableRouteIds", routeIds
                        ));
                    }
                    return ReadinessCheck.up("Required gateway routes are loaded.", Map.of(
                            "requiredRouteIds", properties.requiredRouteIds()
                    ));
                })
                .timeout(properties.timeout())
                .onErrorResume(error -> Mono.just(ReadinessCheck.down(
                        "Gateway route check failed.",
                        Map.of("error", safeMessage(error))
                )));
    }

    private Mono<ReadinessCheck> checkDownstreamHealth() {
        return Flux.fromIterable(properties.requiredServices())
                .flatMap(service -> firstInstanceUri(service)
                        .flatMap(uri -> getJson(uri.resolve("/actuator/health"))
                                .map(body -> Map.entry(service, serviceHealthStatus(body)))
                                .onErrorReturn(Map.entry(service, "DOWN:" + service))))
                .collectList()
                .map(entries -> {
                    Map<String, Object> statuses = entries.stream()
                            .collect(Collectors.toMap(
                                    Map.Entry::getKey,
                                    Map.Entry::getValue,
                                    (left, right) -> left,
                                    LinkedHashMap::new
                            ));
                    List<String> unhealthy = entries.stream()
                            .filter(entry -> !"UP".equals(entry.getValue()))
                            .map(Map.Entry::getKey)
                            .toList();
                    if (!unhealthy.isEmpty()) {
                        return ReadinessCheck.down("One or more downstream services are not healthy.", Map.of(
                                "unhealthyServices", unhealthy,
                                "healthStatuses", statuses,
                                "coverage", "Service actuator health covers each service's DB/Kafka indicators when exposed by Spring Boot."
                        ));
                    }
                    return ReadinessCheck.up("Downstream service health endpoints are UP.", Map.of(
                            "healthStatuses", statuses,
                            "coverage", "Service actuator health covers each service's DB/Kafka indicators when exposed by Spring Boot."
                    ));
                })
                .timeout(properties.timeout().multipliedBy(Math.max(1, properties.requiredServices().size())))
                .onErrorResume(error -> Mono.just(ReadinessCheck.down(
                        "Downstream health check failed.",
                        Map.of("error", safeMessage(error))
                )));
    }

    private Mono<ReadinessCheck> checkSeedCatalog() {
        return firstInstanceUri("INVENTORY-SERVICE")
                .flatMap(uri -> webClient.get()
                        .uri(uri.resolve("/api/v1/inventory/public/items"))
                        .retrieve()
                        .bodyToMono(LIST_OF_MAP_RESPONSE))
                .map(items -> {
                    long productsWithImageMetadata = items.stream()
                            .filter(item -> hasText(item.get("imageKey")) || hasText(item.get("imageUrl")))
                            .count();
                    Optional<Map<String, Object>> firstWithImageKey = items.stream()
                            .filter(item -> hasText(item.get("imageKey")))
                            .findFirst();
                    Map<String, Object> details = new LinkedHashMap<>();
                    details.put("productCount", items.size());
                    details.put("minimumSeedProducts", properties.minimumSeedProducts());
                    details.put("productsWithImageMetadata", productsWithImageMetadata);
                    firstWithImageKey.ifPresent(item -> details.put("sampleImageKey", item.get("imageKey")));

                    if (items.size() < properties.minimumSeedProducts()) {
                        return ReadinessCheck.down("Seed catalog does not contain enough products.", details);
                    }
                    if (productsWithImageMetadata == 0) {
                        return ReadinessCheck.down("Seed catalog has no product image metadata.", details);
                    }
                    return ReadinessCheck.up("Seed catalog is available.", details);
                })
                .timeout(properties.timeout())
                .onErrorResume(error -> Mono.just(ReadinessCheck.down(
                        "Seed catalog check failed.",
                        Map.of("error", safeMessage(error))
                )));
    }

    private Mono<ReadinessCheck> checkMinioFromCatalog(ReadinessCheck seedCatalogCheck) {
        if (!isMinioRequired()) {
            return Mono.just(ReadinessCheck.warn(
                    "MiniIO object check is not configured. Set shopverse.readiness.minio-object-base-url to require it.",
                    Map.of("configured", false)
            ));
        }

        Object imageKey = seedCatalogCheck.details().get("sampleImageKey");
        if (!hasText(imageKey)) {
            return Mono.just(ReadinessCheck.down("MiniIO object check could not find a seeded product image key.", Map.of(
                    "minioObjectBaseUrl", properties.minioObjectBaseUrl()
            )));
        }

        String objectUrl = properties.minioObjectBaseUrl() + "/" + imageKey;
        return webClient.get()
                .uri(URI.create(objectUrl))
                .retrieve()
                .onStatus(HttpStatusCode::isError, response -> Mono.error(new IllegalStateException(
                        "MiniIO object returned HTTP " + response.statusCode().value()
                )))
                .toBodilessEntity()
                .timeout(properties.timeout())
                .thenReturn(ReadinessCheck.up("Seeded product image object is reachable in MiniIO.", Map.of(
                        "configured", true,
                        "sampleImageKey", imageKey
                )))
                .onErrorResume(error -> Mono.just(ReadinessCheck.down("Seeded product image object is not reachable in MiniIO.", Map.of(
                        "configured", true,
                        "sampleImageKey", imageKey,
                        "error", safeMessage(error)
                ))));
    }

    private Mono<URI> firstInstanceUri(String serviceId) {
        return discoveryClient.getInstances(serviceId)
                .next()
                .map(ServiceInstance::getUri)
                .switchIfEmpty(Mono.error(new IllegalStateException("No discovery instance for " + serviceId)));
    }

    private Mono<Map<String, Object>> getJson(URI uri) {
        return webClient.get()
                .uri(uri)
                .retrieve()
                .bodyToMono(MAP_RESPONSE)
                .timeout(properties.timeout());
    }

    private String serviceHealthStatus(Map<String, Object> body) {
        Object status = body.get("status");
        return status == null ? "UNKNOWN" : status.toString().toUpperCase(Locale.ROOT);
    }

    private boolean isMinioRequired() {
        return hasText(properties.minioObjectBaseUrl());
    }

    private boolean hasText(Object value) {
        return value != null && !value.toString().isBlank();
    }

    private String safeMessage(Throwable error) {
        Throwable root = error;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        return Objects.toString(root.getMessage(), root.getClass().getSimpleName());
    }
}
