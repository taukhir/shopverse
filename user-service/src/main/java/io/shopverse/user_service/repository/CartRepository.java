package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.Cart;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    @EntityGraph(attributePaths = {"items", "user"})
    Optional<Cart> findByUserUsername(String username);
}
