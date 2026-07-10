import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { Order, OrdersApiService } from './orders-api.service';

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, DatePipe, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, ServiceNoticeComponent],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent {
  private readonly ordersApi = inject(OrdersApiService);
  protected readonly orders = signal<Order[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly search = signal('');
  protected readonly statusFilter = signal('ALL');
  protected readonly sort = signal<'newest' | 'oldest' | 'amountDesc' | 'amountAsc' | 'status'>('newest');
  protected readonly statuses = computed(() => ['ALL', ...Array.from(new Set(this.orders().map((order) => order.status))).sort()]);
  protected readonly filteredOrders = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const orders = this.orders().filter((order) => {
      const matchesStatus = status === 'ALL' || order.status === status;
      const haystack = `${order.orderNumber} ${order.customerUsername ?? ''} ${order.status}`.toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
    return [...orders].sort((a, b) => {
      switch (this.sort()) {
        case 'oldest': return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'amountDesc': return b.totalAmount - a.totalAmount;
        case 'amountAsc': return a.totalAmount - b.totalAmount;
        case 'status': return a.status.localeCompare(b.status);
        default: return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.ordersApi.listCustomerOrders().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected itemLabel(order: Order): string {
    const count = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    return count === 1 ? '1 item' : `${count} items`;
  }

  protected statusLabel(status: string): string {
    return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected statusTone(status: string): 'good' | 'warning' | 'danger' | 'active' {
    if (status === 'CONFIRMED' || status === 'COMPLETED') return 'good';
    if (status.includes('FAILED') || status.includes('REJECTED') || status.includes('CANCELLED')) return 'danger';
    if (status.includes('PENDING') || status.includes('CREATED')) return 'warning';
    return 'active';
  }

  protected progress(order: Order): number {
    const status = order.status;
    if (status === 'CONFIRMED' || status === 'COMPLETED') return 100;
    if (status.includes('FAILED') || status.includes('REJECTED') || status.includes('CANCELLED')) return 100;
    if (status.includes('PAYMENT')) return 72;
    if (status.includes('INVENTORY') || status.includes('RESERVED')) return 55;
    if (status.includes('CREATED') || status.includes('PENDING')) return 32;
    return 45;
  }

  protected currentStatusMessage(order: Order): string {
    const status = order.status;
    if (status === 'CONFIRMED') return 'Confirmed and ready for fulfillment tracking.';
    if (status.includes('REJECTED')) return 'Stopped during inventory or business validation.';
    if (status.includes('FAILED') || status.includes('CANCELLED')) return 'Needs attention before it can proceed.';
    if (status.includes('PAYMENT')) return 'Payment workflow is currently in progress.';
    if (status.includes('INVENTORY') || status.includes('RESERVED')) return 'Inventory reservation is being verified.';
    return 'Order is moving through the checkout workflow.';
  }

  protected clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
    this.sort.set('newest');
  }
}
