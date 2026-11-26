import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { ToastService } from '../../core/feedback/toast.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { Payment, PaymentApiService } from './payment-api.service';

@Component({
  selector: 'app-reconciliation-admin',
  imports: [AdminHeaderComponent, DatePipe, LoadingSkeletonComponent, RouterLink],
  template: `
    <app-admin-header (signOut)="logout()" />
    <main class="admin-page-shell">
      <header class="heading"><div><p class="eyebrow">FINANCE OPERATIONS</p><h1>Reconciliation</h1><p>Payment records requiring attention, with supported payment actions.</p></div><button type="button" (click)="load()">Refresh</button></header>
      @if (loading()) { <app-loading-skeleton [rows]="5" /> }
      @else if (error()) { <section class="notice" role="alert">{{ error() }} <button type="button" (click)="load()">Retry</button></section> }
      @else {
        @if (message()) { <p role="status">{{ message() }}</p> }
        <section class="table" aria-label="Payment reconciliation queue">
          @for (payment of attention(); track payment.id) {
            <article><div><span>{{ payment.orderNumber }}</span><strong>{{ payment.status }}</strong><small>Updated {{ payment.updatedAt | date:'medium' }}</small></div><b>{{ payment.amount }}</b><div class="actions">
              @if (payment.status === 'TIMED_OUT') { <button type="button" [disabled]="busy() === payment.orderNumber" (click)="act(payment,'reconcile')">{{ busy() === payment.orderNumber ? 'Working…' : 'Reconcile' }}</button> }
              @if (payment.status === 'DECLINED' || payment.status === 'TIMED_OUT') { <button type="button" [disabled]="busy() === payment.orderNumber" (click)="act(payment,'retry')">Retry payment</button> }
              <a routerLink="/admin/orders">Order operations</a>
            </div></article>
          } @empty { <p class="empty">No payments currently need reconciliation.</p> }
        </section>
        <p class="muted">This view uses the existing payment list API. A cross-service reconciliation history and audit trail require a backend aggregation endpoint.</p>
      }
    </main>
  `,
  styles: [`
    .table article { display:grid;grid-template-columns:minmax(180px,1fr) auto minmax(220px,auto);align-items:center;gap:16px;padding:18px;border-bottom:1px solid var(--line,#dedee6) }
    .table article div:first-child { display:grid;gap:5px }.actions {display:flex;gap:8px;flex-wrap:wrap}.actions a {align-self:center}
    @media(max-width:700px){.table article{grid-template-columns:1fr}.actions{align-items:center}}
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
  protected readonly attention = computed(() => this.payments().filter((payment) => ['TIMED_OUT', 'DECLINED', 'PENDING', 'AUTHORIZED'].includes(payment.status)));

  constructor() { this.load(); }
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
