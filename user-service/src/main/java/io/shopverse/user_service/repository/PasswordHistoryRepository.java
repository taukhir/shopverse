package io.shopverse.user_service.repository;

import io.shopverse.user_service.entities.PasswordHistory;
import io.shopverse.user_service.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {

    List<PasswordHistory> findTop5ByUserOrderByChangedAtDesc(User user);
}
