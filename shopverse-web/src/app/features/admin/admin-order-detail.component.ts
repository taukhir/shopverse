import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { SessionService } from '../../core/auth/session.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { formatInr } from '../../shared/utils/formatters';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface ShippingAddress {
  recipientName: string;
  phoneNumber?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Order {
  id: number;
  orderNumber: string;
  correlationId: string;
  idempotencyKey: string;
  customerUsername: string;
  status: string;
  totalAmount: number;
  shippingAddress?: ShippingAddress | null;
  items: OrderItem[];
  createdAt: string;
}

interface TimelineEvent {
  orderNumber: string;
  correlationId: string;
  stage: string;
  detail: string;
  occurredAt: string;
}

interface Payment {
  id: number;
  orderNumber: string;
  correlationId: string;
  amount: number;
  status: string;
  paymentReference: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InventoryReservation {
  id: number;
  orderNumber: string;
  correlationId: string;
  productId: number;
  quantity: number;
  status: string;
  expiresAt: string;
}

@Component({
  selector: 'app-admin-order-detail',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);
  protected readonly order = signal<Order | null>(null);
  protected readonly timeline = signal<TimelineEvent[]>([]);
  protected readonly payment = signal<Payment | null>(null);
  protected readonly reservation = signal<InventoryReservation | null>(null);
  protected readonly loading = signal(true);
  protected readonly actionLoading = signal(false);
  protected readonly error = signal('');

  constructor() {
    this.load();
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Order id is missing.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.http.get<Order>(API_PATHS.orders.byId(id)).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadOperationalState(order);
      },
      error: () => {
        this.error.set('Order details are unavailable.');
        this.loading.set(false);
      },
    });
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected cleanStage(stage: string): string {
    return stage.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected canCancelOrder(): boolean {
    return ['ORDER_CREATED', 'PENDING_INVENTORY', 'INVENTORY_RESERVED', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED'].includes(this.order()?.status ?? '');
  }

  protected canPackOrder(): boolean {
    return this.order()?.status === 'CONFIRMED';
  }

  protected canShipOrder(): boolean {
    return ['PACKING', 'SHIPPED'].includes(this.order()?.status ?? '');
  }

  protected canDeliverOrder(): boolean {
    return ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(this.order()?.status ?? '');
  }

  protected actionHint(): string {
    const order = this.order();
    const status = order?.status ?? '';
    if (!order) return 'Load an order to inspect operations.';
    if (this.canCancelOrder()) return 'This order can be cancelled from operations.';
    if (this.canPackOrder()) return 'This confirmed order is ready for packing.';
    if (this.canShipOrder()) return status === 'SHIPPED' ? 'This order can move out for delivery.' : 'This packed order can be shipped.';
    if (this.canDeliverOrder()) return 'This shipment can be marked delivered.';
    if (status === 'CONFIRMED') return 'Confirmed orders are locked until refund/return workflows are added.';
    if (status === 'DELIVERED') return 'Delivered orders are complete unless the customer requests a return.';
    if (status === 'RETURN_REQUESTED') return 'Customer requested a return. Return approval workflow is pending.';
    if (status === 'CANCELLED') return 'This order is already cancelled. No further cancellation action is available.';
    if (status === 'INVENTORY_REJECTED') return 'Inventory rejected this order. Ask the customer to create a new checkout.';
    return 'No direct admin action is currently available for this state.';
  }

  protected paymentHint(): string {
    const payment = this.payment();
    if (!payment) return 'No payment record returned yet.';
    if (['DECLINED', 'TIMED_OUT', 'FAILED'].includes(payment.status)) return 'Payment needs attention. Use payment operations for reconciliation or refund tooling.';
    if (payment.status === 'CAPTURED') return 'Payment is captured. Watch order confirmation timeline.';
    return 'Payment is still progressing through the workflow.';
  }

  protected async cancelOrder(): Promise<void> {
    const order = this.order();
    if (!order || !this.canCancelOrder() || this.actionLoading()) return;
    const confirmed = await this.confirm.confirm({
      title: 'Cancel order?',
      message: `Cancel ${order.orderNumber} for ${order.customerUsername}?`,
      confirmText: 'Cancel order',
    });
    if (!confirmed) return;

    this.actionLoading.set(true);
    this.http.post<Order>(API_PATHS.orders.adminCancel(order.id), {}).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.toast.info(`Order ${updated.orderNumber} cancelled.`);
        this.loadOperationalState(updated);
      },
      error: () => {
        this.actionLoading.set(false);
        this.toast.error('Admin cancellation failed for this order state.');
      },
    });
  }

  protected runFulfillmentAction(action: 'pack' | 'ship' | 'deliver'): void {
    const order = this.order();
    if (!order || this.actionLoading()) return;
    const path = action === 'pack'
      ? API_PATHS.orders.adminPack(order.id)
      : action === 'ship'
        ? API_PATHS.orders.adminShip(order.id)
        : API_PATHS.orders.adminDeliver(order.id);
    this.actionLoading.set(true);
    this.http.post<Order>(path, {}).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.toast.success(`Order moved to ${this.cleanStage(updated.status)}.`);
        this.loadOperationalState(updated);
      },
      error: () => {
        this.actionLoading.set(false);
        this.toast.error('Fulfillment action failed for this order state.');
      },
    });
  }

  protected logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/');
  }

  private loadOperationalState(order: Order): void {
    forkJoin({
      timeline: this.http.get<TimelineEvent[]>(API_PATHS.orders.timeline(order.id)).pipe(catchError(() => of([]))),
      payment: this.http.get<Payment>(API_PATHS.payments.byOrder(order.orderNumber)).pipe(catchError(() => of(null))),
      reservation: this.http.get<InventoryReservation>(API_PATHS.inventory.reservationByOrder(order.orderNumber)).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ timeline, payment, reservation }) => {
        this.timeline.set(timeline);
        this.payment.set(payment);
        this.reservation.set(reservation);
        this.loading.set(false);
        this.actionLoading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.actionLoading.set(false);
      },
    });
  }
}
