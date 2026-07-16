package io.shopverse.user_service.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_audit_events")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String area;

    @Column(nullable = false, length = 120)
    private String action;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 120)
    private String actor;

    @Column(nullable = false, length = 40)
    private String result;

    @Column(length = 80)
    private String status;

    @Column(length = 500)
    private String message;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Column(length = 80)
    private String subjectType;

    @Column(length = 120)
    private String subjectId;

    @Column(length = 300)
    private String link;

    @Column(columnDefinition = "TEXT")
    private String metadata;
}
