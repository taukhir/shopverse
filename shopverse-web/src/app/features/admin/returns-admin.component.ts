import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { API_PATHS } from '../../core/api/api-paths';
import { SessionService } from '../../core/auth/session.service';
import { ToastService } from '../../core/feedback/toast.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { AdminPageHeaderComponent } from '../../shared/ui-state/admin-page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';

interface ReturnOrder { id: number; orderNumber: string; customerUsername: string; status: string; totalAmount: number; createdAt?: string; }

@Component({
  selector: 'app-returns-admin',
  imports: [AdminHeaderComponent, AdminPageHeaderComponent, LoadingSkeletonComponent, RouterLink],
  template: `
    <app-admin-header (signOut)="logout()" />
    <main class="admin-page-shell">
      <app-admin-page-header eyebrow="CUSTOMER CARE" title="Returns &amp; refunds" description="Inspect return requests while approval actions are being added to the services."><button class="admin-page-action" type="button" (click)="load()">Refresh</button></app-admin-page-header>
      @if (loading()) { <app-loading-skeleton [rows]="4" /> }
      @else if (error()) { <section class="notice" role="alert">{{ error() }} <button type="button" (click)="load()">Retry</button></section> }
      @else {
        <p class="notice">Approval and rejection are not available yet. This queue is read-only; do not treat a refund as return approval.</p>
        <section class="table" aria-label="Return request queue">
          @for (order of requests(); track order.id) {
            <article><div><span>{{ order.orderNumber }}</span><strong>{{ order.customerUsername }}</strong></div><em>{{ order.status }}</em><b>{{ order.totalAmount }}</b><a [routerLink]="['/admin/orders', order.id]">View order</a></article>
          } @empty { <p class="empty">No return requests are currently visible.</p> }
        </section>
      }
    </main>
  `,
  styles: [`
    .table article{display:grid;grid-template-columns:minmax(170px,1fr) auto auto auto;align-items:center;gap:16px;padding:18px;border-bottom:1px solid var(--line,#dedee6)}.table article div{display:grid;gap:5px}
    @media(max-width:700px){.table article{grid-template-columns:1fr 1fr}.table article div{grid-column:1/-1}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReturnsAdminComponent {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly orders = signal<ReturnOrder[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly requests = computed(() => this.orders().filter((order) => order.status === 'RETURN_REQUESTED'));
  constructor() { this.load(); }
  protected load(): void { this.loading.set(true); this.error.set(''); this.http.get<ReturnOrder[]>(API_PATHS.orders.adminAll).subscribe({ next: (orders) => { this.orders.set(orders); this.loading.set(false); }, error: () => { this.error.set('Orders could not be loaded.'); this.loading.set(false); } }); }
  protected logout(): void { this.session.logoutFromServer().subscribe({ next: () => this.router.navigateByUrl('/'), error: () => this.toast.error('Sign out failed.') }); }
}
