import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { API_PATHS } from '../../core/api/api-paths';
import { SessionService } from '../../core/auth/session.service';
import { ToastService } from '../../core/feedback/toast.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { AdminPageHeaderComponent } from '../../shared/ui-state/admin-page-header.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { AdminTablePaginationComponent } from '../../shared/ui-state/admin-table-pagination.component';
import { statusTone } from '../../shared/utils/status-tone';

interface ReturnOrder { id: number; orderNumber: string; customerUsername: string; status: string; totalAmount: number; createdAt?: string; }

@Component({
  selector: 'app-returns-admin',
  imports: [AdminHeaderComponent, AdminPageHeaderComponent, AdminTablePaginationComponent, FormsModule, LoadingSkeletonComponent, RouterLink],
  template: `
    <app-admin-header (signOut)="logout()" />
    <main class="admin-page-shell">
      <app-admin-page-header eyebrow="CUSTOMER CARE" title="Returns &amp; refunds" description="Inspect return requests while approval actions are being added to the services."><button class="admin-page-action" type="button" (click)="load()">Refresh</button></app-admin-page-header>
      @if (loading()) { <app-loading-skeleton [rows]="4" /> }
      @else if (error()) { <section class="notice" role="alert">{{ error() }} <button type="button" (click)="load()">Retry</button></section> }
      @else {
        <p class="notice">Approval and rejection are not available yet. This queue is read-only; do not treat a refund as return approval.</p>
        <section class="admin-filter-bar" aria-label="Return request filters"><label>Search<input class="ui-field" type="search" placeholder="Order number or customer" [ngModel]="search()" (ngModelChange)="search.set($event); page.set(1)" /></label></section>
        <section class="table admin-record-list" aria-label="Return request queue">
          @for (order of visibleRequests(); track order.id) {
            <article class="admin-record-row return-record"><div><span>{{ order.orderNumber }}</span><strong>{{ order.customerUsername }}</strong></div><span [class]="'ui-status-badge ui-status-badge--' + statusTone(order.status)">{{ order.status }}</span><b>{{ order.totalAmount }}</b><a class="ui-button ui-button--secondary" [routerLink]="['/admin/orders', order.id]">View order</a></article>
          } @empty { <p class="empty">No return requests are currently visible.</p> }
        </section>
        @if (filteredRequests().length) { <app-admin-table-pagination [label]="pageLabel()" [page]="page()" [pageCount]="pageCount()" (pageChange)="page.set($event)" /> }
      }
    </main>
  `,
  styles: [`
    .table.admin-record-list{gap:0}.return-record{display:grid;grid-template-columns:minmax(170px,1fr) auto auto auto;align-items:center;gap:16px;padding:16px 18px}.return-record div{display:grid;gap:5px}.return-record a{width:max-content}
    @media(max-width:900px){.return-record{grid-template-columns:minmax(0,1fr) auto}.return-record div{grid-column:1/-1}}
    @media(max-width:620px){.return-record{grid-template-columns:1fr;gap:10px}.return-record div{grid-column:auto}.return-record a{width:100%}}
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
  protected readonly search = signal('');
  protected readonly page = signal(1);
  private readonly pageSize = 8;
  protected readonly requests = computed(() => this.orders().filter((order) => order.status === 'RETURN_REQUESTED'));
  protected readonly filteredRequests = computed(() => {
    const query = this.search().trim().toLowerCase();
    return this.requests().filter((order) => !query || `${order.orderNumber} ${order.customerUsername}`.toLowerCase().includes(query));
  });
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filteredRequests().length / this.pageSize)));
  protected readonly visibleRequests = computed(() => this.filteredRequests().slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize));
  protected pageLabel(): string { const total = this.filteredRequests().length; const start = total ? (this.page() - 1) * this.pageSize + 1 : 0; return `${start}-${Math.min(this.page() * this.pageSize, total)} of ${total} return requests`; }
  protected statusTone(value: string): string { return statusTone(value); }
  constructor() { this.load(); }
  protected load(): void { this.loading.set(true); this.error.set(''); this.http.get<ReturnOrder[]>(API_PATHS.orders.adminAll).subscribe({ next: (orders) => { this.orders.set(orders); this.loading.set(false); }, error: () => { this.error.set('Orders could not be loaded.'); this.loading.set(false); } }); }
  protected logout(): void { this.session.logoutFromServer().subscribe({ next: () => this.router.navigateByUrl('/'), error: () => this.toast.error('Sign out failed.') }); }
}
