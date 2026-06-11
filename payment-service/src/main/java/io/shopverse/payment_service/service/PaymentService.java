package io.shopverse.payment_service.service;

import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.entity.PaymentEntity;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {

    PaymentEntity process(String orderNumber, String correlationId, String customerUsername, BigDecimal amount);

    PaymentResponse reconcile(String orderNumber);

    PaymentResponse refund(String orderNumber);

    PaymentResponse getByOrderNumber(String orderNumber);

    List<PaymentResponse> getAll();
}
