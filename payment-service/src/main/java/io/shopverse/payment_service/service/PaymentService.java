package io.shopverse.payment_service.service;

import io.shopverse.payment_service.dto.PaymentResponse;
import io.shopverse.payment_service.dto.PaymentWebhookRequest;
import io.shopverse.payment_service.entity.PaymentEntity;

import java.math.BigDecimal;
import java.util.List;

public interface PaymentService {

    PaymentEntity process(String orderNumber, String correlationId, String customerUsername, BigDecimal amount);

    PaymentResponse createIntent(String orderNumber, String correlationId, String customerUsername, BigDecimal amount);

    PaymentResponse retry(String orderNumber);

    PaymentResponse reconcile(String orderNumber);

    PaymentResponse refund(String orderNumber);

    PaymentResponse applyWebhook(PaymentWebhookRequest request);

    PaymentResponse getByOrderNumber(String orderNumber);

    List<PaymentResponse> getAll();
}
