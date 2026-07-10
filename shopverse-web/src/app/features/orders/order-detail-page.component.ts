import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ToastService } from '../../core/feedback/toast.service';
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

  protected async copy(value: string | null | undefined, label: string): Promise<void> {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      this.toast.success(`${label} copied.`);
    } catch {
      this.toast.error(`Could not copy ${label}.`);
    }
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
    if (orderStatus === 'CONFIRMED') return 'Your order is confirmed. We will keep the timeline updated as fulfillment features come online.';
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
