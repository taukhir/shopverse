package io.shopverse.gateway.readiness;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ReadinessCollectionsTest {

    @Test
    void readinessReportsSnapshotTheirInputMaps() {
        var details = new LinkedHashMap<String, Object>();
        details.put("count", 1);
        var check = ReadinessCheck.up("Ready", details);
        var checks = new LinkedHashMap<String, ReadinessCheck>();
        checks.put("service", check);
        var response = new ReadinessResponse("UP", Instant.now(), 1, checks);

        details.clear();
        checks.clear();

        assertThat(check.details()).containsEntry("count", 1);
        assertThat(response.checks()).containsEntry("service", check);
        assertThatThrownBy(() -> check.details().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> response.checks().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void configuredServiceAndRouteListsStayImmutable() {
        var services = new ArrayList<>(List.of("USER-SERVICE"));
        var routes = new ArrayList<>(List.of("user-service"));
        var properties = new ShopverseReadinessProperties(services, routes, 1, null, null);

        services.clear();
        routes.clear();

        assertThat(properties.requiredServices()).containsExactly("USER-SERVICE");
        assertThat(properties.requiredRouteIds()).containsExactly("user-service");
        assertThatThrownBy(() -> properties.requiredServices().clear()).isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> properties.requiredRouteIds().clear()).isInstanceOf(UnsupportedOperationException.class);
    }
}
