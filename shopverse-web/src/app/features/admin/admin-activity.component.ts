import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { uniqueSorted } from '../../shared/utils/collection';
import { formatInr } from '../../shared/utils/formatters';
import { AdminApiService, AdminAuditEvent, AdminFailedEvent, AdminInventoryItem, AdminOrder, AdminPayment } from './admin-api.service';

type ActivityArea = 'ALL' | 'ORDERS' | 'INVENTORY' | 'PAYMENTS' | 'RECOVERY';
type ActivityResult = 'ALL' | 'SUCCESS' | 'ATTENTION' | 'FAILED' | 'PENDING';

interface AdminActivityEvent {
  id: string;
  area: Exclude<ActivityArea, 'ALL'>;
  title: string;
  description: string;
  actor: string;
  occurredAt: string;
  result: Exclude<ActivityResult, 'ALL'>;
  status: string;
  link?: string;
  meta?: string;
}

@Component({
  selector: 'app-admin-activity',
  imports: [FormsModule, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './admin-activity.component.html',
  styleUrl: './admin-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly events = signal<AdminActivityEvent[]>([]);
  protected readonly source = signal<'audit' | 'derived'>('derived');
  protected readonly areaFilter = signal<ActivityArea>('ALL');
  protected readonly resultFilter = signal<ActivityResult>('ALL');
  protected readonly actorFilter = signal('ALL');
  protected readonly query = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = 12;

  protected readonly areas: ActivityArea[] = ['ALL', 'ORDERS', 'INVENTORY', 'PAYMENTS', 'RECOVERY'];
  protected readonly results: ActivityResult[] = ['ALL', 'SUCCESS', 'ATTENTION', 'FAILED', 'PENDING'];
  protected readonly actors = computed(() => ['ALL', ...uniqueSorted(this.events().map((event) => event.actor))]);
  protected readonly filteredEvents = computed(() => {
    const query = this.query().trim().toLowerCase();
    const area = this.areaFilter();
    const result = this.resultFilter();
    const actor = this.actorFilter();

    return this.events()
      .filter((event) => area === 'ALL' || event.area === area)
      .filter((event) => result === 'ALL' || event.result === result)
      .filter((event) => actor === 'ALL' || event.actor === actor)
      .filter((event) => {
        if (!query) return true;
        const haystack = `${event.title} ${event.description} ${event.status} ${event.meta ?? ''}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => (b.occurredAt || '').localeCompare(a.occurredAt || ''));
  });
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredEvents().length / this.pageSize)));
  protected readonly visibleEvents = computed(() => {
    const page = Math.min(Math.max(1, this.page()), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredEvents().slice(start, start + this.pageSize);
  });
  protected readonly summary = computed(() => {
    const events = this.events();
    return {
      total: events.length,
      attention: events.filter((event) => event.result === 'ATTENTION' || event.result === 'FAILED').length,
      orders: events.filter((event) => event.area === 'ORDERS').length,
      recovery: events.filter((event) => event.area === 'RECOVERY').length,
    };
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');

    this.adminApi.loadAuditEvents().subscribe({
      next: (events) => {
        this.events.set(events.map((event) => this.fromAuditEvent(event)));
        this.source.set('audit');
        this.page.set(1);
        this.loading.set(false);
      },
      error: () => this.loadDerivedActivity(),
    });
  }

  private loadDerivedActivity(): void {
    this.adminApi.loadOverview().subscribe({
      next: ({ orders, inventory, payments, orderDeadLetters, inventoryDeadLetters, paymentDeadLetters }) => {
        const failedEvents = [
          ...orderDeadLetters.map((event) => ({ ...event, service: 'Orders' })),
          ...inventoryDeadLetters.map((event) => ({ ...event, service: 'Inventory' })),
          ...paymentDeadLetters.map((event) => ({ ...event, service: 'Payments' })),
        ];
        this.events.set([
          ...this.fromOrders(orders),
          ...this.fromPayments(payments),
          ...this.fromInventory(inventory),
          ...this.fromRecovery(failedEvents),
        ]);
        this.source.set('derived');
        this.page.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(APP_MESSAGES.errors.operationsUnavailable);
        this.loading.set(false);
      },
    });
  }

  protected resetFilters(): void {
    this.areaFilter.set('ALL');
    this.resultFilter.set('ALL');
    this.actorFilter.set('ALL');
    this.query.set('');
    this.page.set(1);
  }

  protected changePage(delta: number): void {
    this.page.set(Math.min(Math.max(1, this.page() + delta), this.pageCount()));
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Sign out?',
      message: 'You will leave the operations workspace.',
      confirmText: 'Sign out',
    });
    if (!confirmed) return;
    this.session.logout();
    this.toast.info('Signed out.');
    this.router.navigateByUrl('/');
  }

  protected pageLabel(): string {
    const total = this.filteredEvents().length;
    if (!total) return '0 events';
    const start = (this.page() - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `${start}-${end} of ${total}`;
  }

  private fromOrders(orders: AdminOrder[]): AdminActivityEvent[] {
    return orders.map((order) => ({
      id: `order-${order.id}`,
      area: 'ORDERS',
      title: `Order ${order.orderNumber}`,
      description: `Current order state is ${this.clean(order.status)} for ${order.customerUsername}.`,
      actor: order.customerUsername || 'system',
      occurredAt: order.createdAt || '',
      result: this.orderResult(order.status),
      status: order.status,
      link: `/admin/orders/${order.id}`,
      meta: formatInr(order.totalAmount || 0),
    }));
  }

  private fromPayments(payments: AdminPayment[]): AdminActivityEvent[] {
    return payments.map((payment) => ({
      id: `payment-${payment.id}`,
      area: 'PAYMENTS',
      title: `Payment ${payment.orderNumber}`,
      description: payment.failureReason || `Payment state is ${this.clean(payment.status)}.`,
      actor: 'payment-service',
      occurredAt: payment.updatedAt || '',
      result: this.paymentResult(payment.status),
      status: payment.status,
      link: '/admin/payments',
      meta: formatInr(payment.amount || 0),
    }));
  }

  private fromAuditEvent(event: AdminAuditEvent): AdminActivityEvent {
    const area = this.normalizeArea(event.area);
    const metadata = event.metadata ? Object.entries(event.metadata).map(([key, value]) => `${key}: ${String(value)}`).join(' · ') : undefined;
    return {
      id: `audit-${event.id}`,
      area,
      title: event.title || event.action || `${area.toLowerCase()} activity`,
      description: event.description || event.message || 'Audit event recorded by backend.',
      actor: event.actor || 'system',
      occurredAt: event.occurredAt || '',
      result: this.normalizeResult(event.result),
      status: event.status || event.action || event.result,
      link: event.link || this.linkForSubject(event.subjectType, event.subjectId),
      meta: metadata || (event.subjectType && event.subjectId ? `${event.subjectType} ${event.subjectId}` : undefined),
    };
  }

  private fromInventory(items: AdminInventoryItem[]): AdminActivityEvent[] {
    return items
      .filter((item) => item.availableQuantity < 5 || item.reservedQuantity > 0 || !item.available)
      .map((item) => ({
        id: `inventory-${item.productId}`,
        area: 'INVENTORY',
        title: item.productName,
        description: `${item.availableQuantity} available, ${item.reservedQuantity} reserved.`,
        actor: 'inventory-service',
        occurredAt: item.updatedAt || '',
        result: item.availableQuantity === 0 || !item.available ? 'ATTENTION' : 'PENDING',
        status: item.available ? 'LOW_STOCK' : 'UNAVAILABLE',
        link: '/admin/inventory',
        meta: `Product ${item.productId}`,
      }));
  }

  private fromRecovery(events: AdminFailedEvent[]): AdminActivityEvent[] {
    return events.map((event) => ({
      id: `recovery-${event.service}-${event.id}`,
      area: 'RECOVERY',
      title: `${event.service || 'Service'} dead-letter ${event.id}`,
      description: event.failureReason || 'Failed event awaiting operator review.',
      actor: event.service?.toLowerCase() || 'recovery',
      occurredAt: event.replayedAt || event.failedAt || '',
      result: event.replayed ? 'SUCCESS' : 'FAILED',
      status: event.replayed ? 'REPLAYED' : 'ACTION_REQUIRED',
      link: '/admin/recovery',
      meta: event.sourceTopic,
    }));
  }

  private orderResult(status: string): Exclude<ActivityResult, 'ALL'> {
    if (['CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(status)) return 'ATTENTION';
    if (['DELIVERED', 'CONFIRMED', 'PAID'].includes(status)) return 'SUCCESS';
    return 'PENDING';
  }

  private paymentResult(status: string): Exclude<ActivityResult, 'ALL'> {
    if (['DECLINED', 'TIMED_OUT', 'FAILED'].includes(status)) return 'FAILED';
    if (['REFUNDED'].includes(status)) return 'ATTENTION';
    if (['CAPTURED', 'RECONCILED'].includes(status)) return 'SUCCESS';
    return 'PENDING';
  }

  private clean(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase();
  }

  private normalizeArea(area: string): Exclude<ActivityArea, 'ALL'> {
    const normalized = area?.toUpperCase();
    if (normalized === 'ORDERS' || normalized === 'INVENTORY' || normalized === 'PAYMENTS' || normalized === 'RECOVERY') return normalized;
    return 'RECOVERY';
  }

  private normalizeResult(result: string): Exclude<ActivityResult, 'ALL'> {
    const normalized = result?.toUpperCase();
    if (normalized === 'SUCCESS' || normalized === 'ATTENTION' || normalized === 'FAILED' || normalized === 'PENDING') return normalized;
    if (normalized === 'ERROR') return 'FAILED';
    if (normalized === 'WARN' || normalized === 'WARNING') return 'ATTENTION';
    return 'PENDING';
  }

  private linkForSubject(subjectType?: string, subjectId?: number | string): string | undefined {
    const type = subjectType?.toUpperCase();
    if (!subjectId) return undefined;
    if (type === 'ORDER') return `/admin/orders/${subjectId}`;
    if (type === 'USER') return `/admin/users/${subjectId}`;
    if (type === 'PAYMENT') return '/admin/payments';
    if (type === 'INVENTORY') return '/admin/inventory';
    return undefined;
  }
}
