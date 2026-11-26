import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { Order, OrdersApiService } from '../orders/orders-api.service';

@Component({
  selector: 'app-notifications-page',
  imports: [DatePipe, EmptyStateComponent, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  protected readonly orders = signal<Order[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly attentionCount = computed(() => this.orders().filter((order) => this.needsAttention(order.status)).length);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.ordersApi.listCustomerOrders().subscribe({
      next: (orders) => {
        this.orders.set([...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected statusLabel(status: string): string {
    return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected needsAttention(status: string): boolean {
    return status.includes('FAILED') || status.includes('REJECTED');
  }

  protected statusMessage(status: string): string {
    if (this.needsAttention(status)) return 'This order needs attention. Open its details to review the latest status.';
    if (status === 'DELIVERED') return 'This order has been delivered.';
    if (status === 'RETURN_REQUESTED') return 'Your return request is awaiting review.';
    if (status === 'CONFIRMED') return 'Your order is confirmed and moving to fulfillment.';
    return 'Your order is progressing. Open its details for the timeline.';
  }

  protected price(value: string): string {
    return formatInr(value);
  }
}
