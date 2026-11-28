import { Subscription } from 'rxjs';

import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { AdminPageHeaderComponent } from '../../shared/ui-state/admin-page-header.component';
import { AdminTablePaginationComponent } from '../../shared/ui-state/admin-table-pagination.component';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { statusTone as getStatusTone } from '../../shared/utils/status-tone';
import { AdminApiService } from './admin-api.service';
import {
  ActivityArea,
  ActivityResult,
  AdminActivityEvent,
  AdminActivityMapperService,
} from './admin-activity-mapper.service';
@Component({
  selector: 'app-admin-activity',
  imports: [
    AdminHeaderComponent,
    AdminPageHeaderComponent,
    AdminTablePaginationComponent,
    FormsModule,
    LoadingSkeletonComponent,
    RouterLink,
    ServiceNoticeComponent,
  ],
  templateUrl: './admin-activity.component.html',
  styleUrl: './admin-activity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminActivityComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly adminApi = inject(AdminApiService);
  private readonly activityMapper = inject(AdminActivityMapperService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly events = signal<AdminActivityEvent[]>([]);
  protected readonly source = signal<'audit' | 'derived'>('derived');
  protected readonly auditTotal = signal(0);
  protected readonly areaFilter = signal<ActivityArea>('ALL');
  protected readonly resultFilter = signal<ActivityResult>('ALL');
  protected readonly actorFilter = signal('ALL');
  protected readonly query = signal('');
  protected queryDraft = '';
  protected actorDraft = '';
  protected readonly page = signal(1);
  protected readonly pageSize = 12;
  private auditRequestId = 0;
  private auditRequest?: Subscription;
  private derivedRequest?: Subscription;

  protected readonly areas: ActivityArea[] = ['ALL', 'ORDERS', 'INVENTORY', 'PAYMENTS', 'RECOVERY', 'USERS'];
  protected readonly results: ActivityResult[] = ['ALL', 'SUCCESS', 'ATTENTION', 'FAILED', 'PENDING'];
  protected readonly filteredEvents = computed(() => {
    if (this.source() === 'audit') return this.events();
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
  protected readonly pageCount = computed(() =>
    Math.max(
      1,
      Math.ceil((this.source() === 'audit' ? this.auditTotal() : this.filteredEvents().length) / this.pageSize),
    ),
  );
  protected readonly visibleEvents = computed(() => {
    if (this.source() === 'audit') return this.events();
    const page = Math.min(Math.max(1, this.page()), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredEvents().slice(start, start + this.pageSize);
  });
  protected readonly summary = computed(() => {
    const events = this.events();
    return {
      total: this.source() === 'audit' ? this.auditTotal() : events.length,
      attention: events.filter((event) => event.result === 'ATTENTION' || event.result === 'FAILED').length,
      orders: events.filter((event) => event.area === 'ORDERS').length,
      recovery: events.filter((event) => event.area === 'RECOVERY').length,
    };
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.auditRequest?.unsubscribe();
      this.derivedRequest?.unsubscribe();
    });
    this.load();
  }

  protected load(): void {
    this.derivedRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.loadAuditPage(true);
  }

  protected filtersChanged(): void {
    this.page.set(1);
    if (this.source() === 'audit') this.loadAuditPage(false);
  }

  protected searchActivity(): void {
    this.query.set(this.queryDraft.trim());
    this.actorFilter.set(this.actorDraft.trim() || 'ALL');
    this.filtersChanged();
  }

  private loadDerivedActivity(requestId: number): void {
    this.derivedRequest?.unsubscribe();
    this.derivedRequest = this.adminApi.loadActivitySources().subscribe({
      next: ({ orders, inventory, payments, orderDeadLetters, inventoryDeadLetters, paymentDeadLetters }) => {
        if (requestId !== this.auditRequestId) return;
        this.events.set(
          this.activityMapper.fromSources({
            orders,
            inventory,
            payments,
            orderDeadLetters,
            inventoryDeadLetters,
            paymentDeadLetters,
          }),
        );
        this.source.set('derived');
        this.page.set(1);
        this.loading.set(false);
      },
      error: () => {
        if (requestId !== this.auditRequestId) return;
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
    this.queryDraft = '';
    this.actorDraft = '';
    this.page.set(1);
    if (this.source() === 'audit') this.loadAuditPage(false);
  }

  protected changePage(delta: number): void {
    this.goToPage(this.page() + delta);
  }

  protected goToPage(target: number): void {
    const next = Math.min(Math.max(1, target), this.pageCount());
    if (next === this.page()) return;
    this.page.set(next);
    if (this.source() === 'audit') this.loadAuditPage(false);
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Sign out?',
      message: 'You will leave the operations workspace.',
      confirmText: 'Sign out',
    });
    if (!confirmed) return;
    this.session.logoutFromServer().subscribe({
      next: () => {
        this.toast.info('Signed out.');
        this.router.navigateByUrl('/');
      },
      error: () => this.toast.error('Sign out failed. Please check your connection and try again.'),
    });
  }

  protected pageLabel(): string {
    const total = this.source() === 'audit' ? this.auditTotal() : this.filteredEvents().length;
    if (!total) return '0 events';
    const start = (this.page() - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `${start}-${end} of ${total}`;
  }

  protected statusTone(value: string): string {
    return getStatusTone(value);
  }

  private loadAuditPage(fallbackOnError: boolean): void {
    this.auditRequest?.unsubscribe();
    this.derivedRequest?.unsubscribe();
    const requestId = ++this.auditRequestId;
    this.loading.set(true);
    this.error.set('');
    const area = this.areaFilter() === 'ALL' ? '' : this.areaFilter();
    const result = this.resultFilter() === 'ALL' ? '' : this.resultFilter();
    const actor = this.actorFilter() === 'ALL' ? '' : this.actorFilter();
    this.auditRequest = this.adminApi
      .loadAuditEvents(this.page() - 1, this.pageSize, area, actor, result, this.query())
      .subscribe({
        next: (response) => {
          if (requestId !== this.auditRequestId) return;
          this.events.set(this.activityMapper.fromAuditEvents(response.content));
          this.auditTotal.set(response.totalElements);
          this.source.set('audit');
          this.loading.set(false);
        },
        error: () => {
          if (requestId !== this.auditRequestId) return;
          if (fallbackOnError) this.loadDerivedActivity(requestId);
          else {
            this.error.set(APP_MESSAGES.errors.operationsUnavailable);
            this.loading.set(false);
          }
        },
      });
  }
}
