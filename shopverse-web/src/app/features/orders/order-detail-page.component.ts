import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ToastService } from '../../core/feedback/toast.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { formatInr } from '../../shared/utils/formatters';
import { Order, OrdersApiService, Payment, TimelineEvent } from './orders-api.service';

interface ProgressStep {
  label: string;
  state: 'done' | 'active' | 'blocked' | 'pending';
}

@Component({
  selector: 'app-order-detail-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  protected readonly order = signal<Order | null>(null);
  protected readonly timeline = signal<TimelineEvent[]>([]);
  protected readonly payment = signal<Payment | null>(null);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly steps = computed<ProgressStep[]>(() => {
    const orderStatus = this.order()?.status ?? '';
    const paymentStatus = this.payment()?.status ?? '';
    const stages = new Set(this.timeline().map((event) => event.stage));
    const failed = orderStatus.includes('FAILED') || orderStatus.includes('REJECTED') || paymentStatus === 'DECLINED' || paymentStatus === 'TIMED_OUT';

    return [
      { label: 'Order placed', state: stages.has('ORDER_CREATED') || !!this.order() ? 'done' : 'pending' },
      { label: 'Inventory check', state: stages.has('INVENTORY_REJECTED') ? 'blocked' : stages.has('INVENTORY_RESERVED') ? 'done' : failed ? 'pending' : 'active' },
      { label: 'Payment', state: paymentStatus === 'CAPTURED' ? 'done' : failed ? 'blocked' : paymentStatus ? 'active' : 'pending' },
      { label: 'Confirmed', state: orderStatus === 'CONFIRMED' ? 'done' : failed ? 'blocked' : 'pending' },
    ];
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('error');
      return;
    }
    this.state.set('loading');
    this.ordersApi.getOrder(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadOrderState(order);
      },
      error: () => this.state.set('error'),
    });
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected cleanStage(stage: string): string {
    return stage.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected statusTone(status?: string | null): 'good' | 'warning' | 'danger' | 'active' {
    const value = status ?? '';
    if (value === 'CONFIRMED' || value === 'COMPLETED' || value === 'CAPTURED') return 'good';
    if (value.includes('FAILED') || value.includes('REJECTED') || value.includes('CANCELLED') || value === 'DECLINED' || value === 'TIMED_OUT') {
      return 'danger';
    }
    if (value.includes('PENDING') || value.includes('CREATED')) return 'warning';
    return 'active';
  }

  protected currentStatus(): string {
    return this.cleanStage(this.order()?.status ?? 'PROCESSING');
  }

  protected paymentStatus(): string {
    return this.payment()?.status ? this.cleanStage(this.payment()!.status) : 'Not Started';
  }

  protected canCancelOrder(): boolean {
    return ['ORDER_CREATED', 'PENDING_INVENTORY', 'INVENTORY_RESERVED', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED'].includes(this.order()?.status ?? '');
  }

  protected canRetryPayment(): boolean {
    return ['DECLINED', 'TIMED_OUT'].includes(this.payment()?.status ?? '');
  }

  protected canRequestRefund(): boolean {
    return this.payment()?.status === 'CAPTURED';
  }

  protected canRequestReturn(): boolean {
    return this.order()?.status === 'DELIVERED';
  }

  protected async cancelOrder(): Promise<void> {
    const order = this.order();
    if (!order || !this.canCancelOrder()) return;
    const confirmed = await this.confirm.confirm({
      title: 'Cancel order?',
      message: `Cancel ${order.orderNumber}? This cannot be undone from the customer page.`,
      confirmText: 'Cancel order',
    });
    if (!confirmed) return;

    this.ordersApi.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.toast.info(`Order ${updated.orderNumber} cancelled.`);
        this.loadOrderState(updated);
      },
      error: () => this.toast.error('We could not cancel this order from its current state.'),
    });
  }

  protected async copy(value: string | null | undefined, label: string): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      this.toast.success(`${label} copied.`);
    } catch {
      this.toast.error(`Could not copy ${label}.`);
    }
  }

  protected retryPayment(): void {
    const order = this.order();
    if (!order?.orderNumber || !this.canRetryPayment()) return;
    this.ordersApi.retryPayment(order.orderNumber).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.toast.success('Payment retry submitted.');
        this.loadOrderState(order);
      },
      error: () => this.toast.error('Payment retry failed for this payment state.'),
    });
  }

  protected async requestRefund(): Promise<void> {
    const order = this.order();
    if (!order?.orderNumber || !this.canRequestRefund()) return;
    const confirmed = await this.confirm.confirm({
      title: 'Request refund?',
      message: `Request refund for ${order.orderNumber}?`,
      confirmText: 'Request refund',
    });
    if (!confirmed) return;
    this.ordersApi.requestRefund(order.orderNumber).subscribe({
      next: (payment) => {
        this.payment.set(payment);
        this.toast.info('Refund request submitted.');
      },
      error: () => this.toast.error('Refund request failed for this payment state.'),
    });
  }

  protected async requestReturn(): Promise<void> {
    const order = this.order();
    if (!order || !this.canRequestReturn()) return;
    const confirmed = await this.confirm.confirm({
      title: 'Request return?',
      message: `Request a return for ${order.orderNumber}?`,
      confirmText: 'Request return',
    });
    if (!confirmed) return;
    this.ordersApi.requestReturn(order.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.toast.info('Return request submitted.');
        this.loadOrderState(updated);
      },
      error: () => this.toast.error('Return request is not available for this order state.'),
    });
  }

  protected async copyAllReferences(): Promise<void> {
    const order = this.order();
    const payment = this.payment();
    if (!order) return;
    const references = [
      `Order: ${order.orderNumber}`,
      `Correlation: ${order.correlationId || 'Not available'}`,
      `Idempotency: ${order.idempotencyKey || 'Not available'}`,
      `Payment: ${payment?.paymentReference || 'Not captured'}`,
      `Status: ${order.status}`,
    ].join('\n');
    await this.copy(references, 'Order references');
  }

  protected placeholderAction(action: string): void {
    this.toast.info(`${action} will be enabled when the backend workflow is available.`);
  }

  protected nextMessage(): string {
    const orderStatus = this.order()?.status;
    const payment = this.payment();
    if (orderStatus === 'DELIVERED') return 'Your order was delivered. You can request a return if it is still eligible.';
    if (orderStatus === 'RETURN_REQUESTED') return 'Your return request has been submitted and is waiting for operations review.';
    if (['PACKING', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(orderStatus ?? '')) return 'Your order is in fulfillment. Watch the timeline for delivery updates.';
    if (orderStatus === 'CONFIRMED') return 'Your order is confirmed and waiting for fulfillment.';
    if (orderStatus?.includes('REJECTED')) return 'Inventory could not be reserved for this order. Please browse the catalog for alternatives.';
    if (payment?.status === 'DECLINED' || payment?.status === 'TIMED_OUT') return 'Payment did not complete. This demo currently requires admin reconciliation or a new checkout attempt.';
    if (payment?.status === 'CAPTURED') return 'Payment is captured and the order is waiting for final confirmation.';
    return 'Your order is moving through inventory and payment checks. Refresh this page for the latest workflow state.';
  }

  private loadOrderState(order: Order): void {
    this.ordersApi.getOrderWorkflowState(order).subscribe({
      next: ({ timeline, payment }) => {
        this.timeline.set(timeline);
        this.payment.set(payment);
        this.state.set('ready');
      },
      error: () => {
        this.timeline.set([]);
        this.state.set('ready');
      },
    });
  }
}
