import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { ToastService } from '../../core/feedback/toast.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { AdminPageHeaderComponent } from '../../shared/ui-state/admin-page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { AdminTablePaginationComponent } from '../../shared/ui-state/admin-table-pagination.component';
import { statusTone } from '../../shared/utils/status-tone';
import { Payment, PaymentApiService } from './payment-api.service';

@Component({
  selector: 'app-reconciliation-admin',
  imports: [AdminHeaderComponent, AdminPageHeaderComponent, AdminTablePaginationComponent, DatePipe, FormsModule, LoadingSkeletonComponent, RouterLink],
  template: `
    <app-admin-header (signOut)="logout()" />
    <main class="admin-page-shell">
      <app-admin-page-header eyebrow="FINANCE OPERATIONS" title="Reconciliation" description="Payment records requiring attention, with supported payment actions."><button class="admin-page-action" type="button" (click)="load()">Refresh</button></app-admin-page-header>
      @if (loading()) { <app-loading-skeleton [rows]="5" /> }
      @else if (error()) { <section class="notice" role="alert">{{ error() }} <button type="button" (click)="load()">Retry</button></section> }
      @else {
        @if (message()) { <p role="status">{{ message() }}</p> }
        <section class="admin-filter-bar" aria-label="Reconciliation filters">
          <label>Search<input class="ui-field" type="search" placeholder="Order number or status" [ngModel]="search()" (ngModelChange)="search.set($event); page.set(1)" /></label>
          <label>Status<select class="ui-field" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); page.set(1)"><option value="ALL">All attention statuses</option><option value="TIMED_OUT">Timed out</option><option value="DECLINED">Declined</option><option value="PENDING">Pending</option><option value="AUTHORIZED">Authorized</option></select></label>
        </section>
        <section class="table admin-record-list" aria-label="Payment reconciliation queue">
          @for (payment of visibleAttention(); track payment.id) {
            <article class="admin-record-row reconciliation-record"><div><span>{{ payment.orderNumber }}</span><span [class]="'ui-status-badge ui-status-badge--' + statusTone(payment.status)">{{ payment.status }}</span><small>Updated {{ payment.updatedAt | date:'medium' }}</small></div><b>{{ payment.amount }}</b><div class="actions">
              @if (payment.status === 'TIMED_OUT') { <button class="ui-button ui-button--secondary" type="button" [disabled]="busy() === payment.orderNumber" (click)="act(payment,'reconcile')">{{ busy() === payment.orderNumber ? 'Working…' : 'Reconcile' }}</button> }
              @if (payment.status === 'DECLINED' || payment.status === 'TIMED_OUT') { <button class="ui-button ui-button--primary" type="button" [disabled]="busy() === payment.orderNumber" (click)="act(payment,'retry')">Retry payment</button> }
              <a class="ui-button ui-button--quiet" routerLink="/admin/orders">Order operations</a>
            </div></article>
          } @empty { <p class="empty">{{ attention().length ? 'No payments match these filters.' : 'No payments currently need reconciliation.' }}</p> }
        </section>
        @if (filteredAttention().length) { <app-admin-table-pagination [label]="pageLabel()" [page]="page()" [pageCount]="pageCount()" (pageChange)="page.set($event)" /> }
        <p class="muted">This view uses the existing payment list API. A cross-service reconciliation history and audit trail require a backend aggregation endpoint.</p>
      }
    </main>
  `,
  styles: [`
    .table.admin-record-list { gap: 0; }
    .reconciliation-record { display:grid;grid-template-columns:minmax(220px,1fr) auto minmax(250px,auto);align-items:center;gap:16px;padding:16px 18px; }
    .reconciliation-record > div:first-of-type { display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px 12px;min-width:0; }
    .reconciliation-record > div:first-of-type > span:first-child { overflow:hidden;font-size:12px;font-weight:850;text-overflow:ellipsis;white-space:nowrap; }
    .reconciliation-record small { grid-column:1/-1;color:var(--muted);font-size:11px; }
    .reconciliation-record > b { text-align:right;white-space:nowrap; }
    .actions {display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.actions a {align-self:center}
    @media(max-width:900px){.reconciliation-record{grid-template-columns:minmax(0,1fr) auto}.actions{grid-column:1/-1;justify-content:flex-start}}
    @media(max-width:620px){.reconciliation-record{grid-template-columns:1fr;gap:12px}.reconciliation-record > b{text-align:left}.actions{grid-column:auto}.actions>*{flex:1 1 auto}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconciliationAdminComponent {
  private readonly api = inject(PaymentApiService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly busy = signal('');
  protected readonly search = signal('');
  protected readonly statusFilter = signal('ALL');
  protected readonly page = signal(1);
  private readonly pageSize = 8;
  protected readonly attention = computed(() => this.payments().filter((payment) => ['TIMED_OUT', 'DECLINED', 'PENDING', 'AUTHORIZED'].includes(payment.status)));
  protected readonly filteredAttention = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    return this.attention().filter((payment) => (status === 'ALL' || payment.status === status) && (!query || `${payment.orderNumber} ${payment.status}`.toLowerCase().includes(query)));
  });
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredAttention().length / this.pageSize)));
  protected readonly visibleAttention = computed(() => this.filteredAttention().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));

  constructor() { this.load(); }
  protected pageLabel(): string { const total = this.filteredAttention().length; const start = total ? (this.page() - 1) * this.pageSize + 1 : 0; return `${start}-${Math.min(this.page() * this.pageSize, total)} of ${total} matching payments`; }
  protected statusTone(value: string): string { return statusTone(value); }
  protected load(): void {
    this.loading.set(true); this.error.set('');
    this.api.listPayments().subscribe({ next: (items) => { this.payments.set(items); this.loading.set(false); }, error: () => { this.error.set('Payment records could not be loaded.'); this.loading.set(false); } });
  }
  protected act(payment: Payment, action: 'retry' | 'reconcile'): void {
    this.busy.set(payment.orderNumber); this.message.set('');
    this.api.runOrderAction(payment.orderNumber, action).subscribe({
      next: (updated) => { this.payments.update((list) => list.map((item) => item.orderNumber === updated.orderNumber ? updated : item)); this.message.set(`${action === 'retry' ? 'Retry started for' : 'Reconciled'} ${payment.orderNumber}.`); this.busy.set(''); this.toast.success(this.message()); },
      error: () => { this.busy.set(''); this.error.set(`Could not ${action} payment ${payment.orderNumber}.`); },
    });
  }
  protected logout(): void { this.session.logoutFromServer().subscribe({ next: () => this.router.navigateByUrl('/'), error: () => this.toast.error('Sign out failed.') }); }
}
