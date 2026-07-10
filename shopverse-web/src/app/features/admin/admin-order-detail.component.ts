import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { SessionService } from '../../core/auth/session.service';
import { formatInr } from '../../shared/utils/formatters';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  correlationId: string;
  idempotencyKey: string;
  customerUsername: string;
  status: string;
  totalAmount: number;
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
  protected readonly session = inject(SessionService);
  protected readonly order = signal<Order | null>(null);
  protected readonly timeline = signal<TimelineEvent[]>([]);
  protected readonly payment = signal<Payment | null>(null);
  protected readonly reservation = signal<InventoryReservation | null>(null);
  protected readonly loading = signal(true);
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
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
