package io.shopverse.order.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    // PUBLIC APIs

    @GetMapping("/public/health")
    public String health() {
        log.info("Health check requested for order service");
        return "Order Service is UP";
    }

    @GetMapping("/public/catalog")
    public String catalog() {
        log.info("Public product catalog requested through order service");
        return "Public Product Catalog";
    }

    // USER APIs

    @GetMapping
    public String getOrders() {
        log.info("Fetching orders for current user");
        return "Fetching Orders";
    }

    @GetMapping("/{id}")
    public String getOrderById(@PathVariable Long id) {
        log.info("Fetching order by id: {}", id);
        return "Fetching Order " + id;
    }

    @PostMapping
    public String createOrder() {
        log.info("Creating order for current user");
        return "Order Created";
    }

    // ADMIN APIs

    @DeleteMapping("/{id}")
    public String deleteOrder(@PathVariable Long id) {
        log.warn("Deleting order by id: {}", id);
        return "Order Deleted " + id;
    }

    @GetMapping("/admin/all")
    public String allOrders() {
        log.info("Admin requested all orders");
        return "All Orders For Admin";
    }


}
