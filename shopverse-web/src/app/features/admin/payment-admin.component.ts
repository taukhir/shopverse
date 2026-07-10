import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { compareNumber, compareText, uniqueSorted } from '../../shared/utils/collection';
import { formatInr } from '../../shared/utils/formatters';
import { Payment, PaymentAction, PaymentApiService, SimulationMode } from './payment-api.service';

@Component({
  selector: 'app-payment-admin',
  imports: [DatePipe, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './payment-admin.component.html',
  styleUrl: './payment-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentAdminComponent {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  protected readonly payments = signal<Payment[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly actionError = signal('');
  protected readonly actionSuccess = signal('');
  protected readonly busyOrder = signal('');
  protected readonly simulationMode = signal<SimulationMode>('SUCCESS');
  protected readonly simulationSaving = signal(false);
  protected readonly modes: SimulationMode[] = ['SUCCESS', 'DECLINE', 'TIMEOUT'];
  protected readonly search = signal('');
  protected readonly statusFilter = signal('ALL');
  protected readonly sort = signal<'updatedDesc'|'updatedAsc'|'amountDesc'|'amountAsc'|'status'|'order'>('updatedDesc');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;

  protected readonly totals = computed(() => {
    const payments = this.payments();
    return {
      count: payments.length,
      amount: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      captured: payments.filter((payment) => payment.status === 'CAPTURED').length,
      failed: payments.filter((payment) => payment.status === 'DECLINED' || payment.status === 'TIMED_OUT').length,
      pending: payments.filter((payment) => payment.status === 'PENDING' || payment.status === 'AUTHORIZED').length,
      refunded: payments.filter((payment) => payment.status === 'REFUNDED').length,
    };
  });
  protected readonly statuses = computed(() => ['ALL', ...uniqueSorted(this.payments().map((payment) => payment.status))]);
  protected readonly filteredPayments = computed(() => {
    const query = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const payments = this.payments().filter((payment) => {
      const haystack = `${payment.orderNumber} ${payment.paymentReference || ''} ${payment.failureReason || ''} ${payment.status}`.toLowerCase();
      return (status === 'ALL' || payment.status === status) && (!query || haystack.includes(query));
    });
    return [...payments].sort((a, b) => {
      switch (this.sort()) {
        case 'updatedAsc': return (a.updatedAt || '').localeCompare(b.updatedAt || '');
        case 'amountDesc': return compareNumber(b.amount, a.amount);
        case 'amountAsc': return compareNumber(a.amount, b.amount);
        case 'status': return compareText(a.status, b.status);
        case 'order': return compareText(a.orderNumber, b.orderNumber);
        default: return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      }
    });
  });
  protected readonly pageCount = computed(() => this.countPages(this.filteredPayments().length));
  protected readonly visiblePayments = computed(() => {
    const page = this.clampedPage(this.page(), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredPayments().slice(start, start + this.pageSize);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.paymentApi.listPayments().subscribe({
      next: (payments) => {
        this.payments.set(payments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(APP_MESSAGES.errors.paymentsUnavailable);
        this.loading.set(false);
      },
    });
  }

  protected setSimulationMode(): void {
    this.simulationSaving.set(true);
    this.actionError.set('');
    this.actionSuccess.set('');
    this.paymentApi.setSimulationMode(this.simulationMode()).subscribe({
      next: (mode) => {
        this.simulationMode.set(mode);
        this.actionSuccess.set(`Payment simulation set to ${mode}.`);
        this.simulationSaving.set(false);
        this.toast.success(`Payment simulation set to ${mode}.`);
      },
      error: () => {
        this.actionError.set('Could not update payment simulation mode.');
        this.simulationSaving.set(false);
        this.toast.error('Could not update payment simulation mode.');
      },
    });
  }

  protected async reconcile(payment: Payment): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: `Reconcile ${payment.orderNumber}?`,
      message: 'This will ask the payment workflow to complete a payment that is pending or timed out.',
      confirmText: 'Reconcile',
    });
    if (!confirmed) return;
    this.runOrderAction(payment, 'reconcile');
  }

  protected async refund(payment: Payment): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: `Refund ${payment.orderNumber}?`,
      message: 'Refunding a captured payment is a financial operation. Continue only if this is intentional.',
      confirmText: 'Refund',
      tone: 'danger',
    });
    if (!confirmed) return;
    this.runOrderAction(payment, 'refund');
  }

  protected canReconcile(payment: Payment): boolean {
    return payment.status === 'TIMED_OUT' || payment.status === 'PENDING' || payment.status === 'AUTHORIZED';
  }

  protected canRefund(payment: Payment): boolean {
    return payment.status === 'CAPTURED';
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected pageLabel(): string {
    const total = this.filteredPayments().length;
    if (!total) return '0 records';
    const page = this.clampedPage(this.page(), this.pageCount());
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `${start}-${end} of ${total}`;
  }

  protected changePage(delta: number): void {
    this.page.set(this.clampedPage(this.page() + delta, this.pageCount()));
  }

  protected logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/');
  }

  private runOrderAction(payment: Payment, action: PaymentAction): void {
    this.busyOrder.set(payment.orderNumber);
    this.actionError.set('');
    this.actionSuccess.set('');
    this.paymentApi.runOrderAction(payment.orderNumber, action).subscribe({
      next: (updated) => {
        this.payments.update((payments) => payments.map((candidate) => candidate.orderNumber === updated.orderNumber ? updated : candidate));
        this.actionSuccess.set(`Payment ${payment.orderNumber} ${action === 'refund' ? 'refunded' : 'reconciled'}.`);
        this.busyOrder.set('');
        this.toast.success(`Payment ${payment.orderNumber} ${action === 'refund' ? 'refunded' : 'reconciled'}.`);
      },
      error: () => {
        this.actionError.set(`Could not ${action} payment ${payment.orderNumber}.`);
        this.busyOrder.set('');
        this.toast.error(`Could not ${action} payment ${payment.orderNumber}.`);
      },
    });
  }

  private countPages(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  private clampedPage(page: number, pageCount: number): number {
    return Math.min(Math.max(1, page), pageCount);
  }
}
