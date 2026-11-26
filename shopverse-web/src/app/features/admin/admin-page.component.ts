import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { AdminApiService, AdminFailedEvent, AdminInventoryItem, AdminOrder, AdminPayment, AdminUser } from './admin-api.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { AdminPageHeaderComponent } from '../../shared/ui-state/admin-page-header.component';
import { AdminTablePaginationComponent } from '../../shared/ui-state/admin-table-pagination.component';

interface StatusSlice { status:string; count:number; percent:number; }

@Component({
  selector:'app-admin-page',
  imports:[AdminHeaderComponent,AdminPageHeaderComponent,AdminTablePaginationComponent,EmptyStateComponent,FormsModule,LoadingSkeletonComponent,RouterLink,ServiceNoticeComponent],
  templateUrl:'./admin-page.component.html',
  styleUrl:'./admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {
  private readonly route=inject(ActivatedRoute);
  private readonly destroyRef=inject(DestroyRef);
  private readonly adminApi=inject(AdminApiService);
  private readonly confirm=inject(ConfirmService);
  private readonly router=inject(Router);
  protected readonly session=inject(SessionService);
  private readonly toast=inject(ToastService);

  protected readonly section=signal(this.route.snapshot.paramMap.get('section') ?? 'overview');
  protected readonly pageTitle=computed(()=>this.section()==='overview'?'System at a glance.':this.section()==='orders'?'Order operations.':'Customer accounts.');
  protected readonly pageDescription=computed(()=>this.section()==='overview'?'Current operational signals from available ShopVerse services.':this.section()==='orders'?'Search and review customer orders, then open an order to view supported actions.':'Search the customer directory and inspect account access.');
  protected readonly orders=signal<AdminOrder[]>([]);
  protected readonly users=signal<AdminUser[]>([]);
  protected readonly userTotal=signal(0);
  protected readonly inventory=signal<AdminInventoryItem[]>([]);
  protected readonly payments=signal<AdminPayment[]>([]);
  protected readonly failedEvents=signal<AdminFailedEvent[]>([]);
  protected readonly orderSearch=signal('');
  protected orderSearchDraft = '';
  protected readonly userSearch=signal('');
  protected userSearchDraft = '';
  protected readonly orderStatusFilter=signal('ALL');
  protected readonly orderSort=signal<'newest'|'oldest'|'amountDesc'|'amountAsc'|'status'|'customer'|'orderNumber'>('newest');
  protected readonly orderPage=signal(1);
  protected readonly orderTotal=signal(0);
  protected readonly userPage=signal(1);
  protected readonly pageSize=8;
  protected readonly optionalWarning=signal('');
  protected readonly inventoryAvailable=signal(true);
  protected readonly paymentsAvailable=signal(true);
  protected readonly recoveryAvailable=signal(true);
  protected readonly loading=signal(true);
  protected readonly error=signal('');
  private loadGeneration = 0;

  protected readonly openOrderCount=computed(()=>this.orders().filter(order=>order.status!=='CONFIRMED' && order.status!=='CANCELLED').length);
  protected readonly orderRevenue=computed(()=>this.orders().reduce((sum,order)=>sum+Number(order.totalAmount || 0),0));
  protected readonly inventoryTotals=computed(()=>{
    const items=this.inventory();
    return {
      items: items.length,
      available: items.reduce((sum,item)=>sum+Number(item.availableQuantity || 0),0),
      reserved: items.reduce((sum,item)=>sum+Number(item.reservedQuantity || 0),0),
      lowStock: items.filter(item=>item.availableQuantity>0 && item.availableQuantity<5).length,
      outOfStock: items.filter(item=>item.availableQuantity===0 || !item.available).length,
    };
  });
  protected readonly lowStockItems=computed(()=>[...this.inventory()].filter(item=>item.availableQuantity<5).sort((a,b)=>a.availableQuantity-b.availableQuantity).slice(0,5));
  protected readonly paymentTotals=computed(()=>{
    const payments=this.payments();
    return {
      total: payments.length,
      captured: payments.filter(payment=>payment.status==='CAPTURED').length,
      pending: payments.filter(payment=>payment.status==='PENDING' || payment.status==='AUTHORIZED').length,
      failed: payments.filter(payment=>payment.status==='DECLINED' || payment.status==='TIMED_OUT').length,
      refunded: payments.filter(payment=>payment.status==='REFUNDED').length,
      amount: payments.reduce((sum,payment)=>sum+Number(payment.amount || 0),0),
    };
  });
  protected readonly recoverableEvents=computed(()=>this.failedEvents().filter(event=>!event.replayed));
  protected readonly recentFailedEvents=computed(()=>[...this.failedEvents()].sort((a,b)=>(b.failedAt || '').localeCompare(a.failedAt || '')).slice(0,5));
  protected readonly orderStatusSlices=computed(()=>this.slices(this.orders().map(order=>order.status)));
  protected readonly paymentStatusSlices=computed(()=>this.slices(this.payments().map(payment=>payment.status)));
  protected readonly returnRequests=computed(()=>this.orders().filter(order=>order.status==='RETURN_REQUESTED'));
  protected readonly paymentAttention=computed(()=>this.payments().filter(payment=>['DECLINED','TIMED_OUT','PENDING','AUTHORIZED'].includes(payment.status)));
  protected readonly orderStatuses=computed(()=>['ALL','ORDER_CREATED','PENDING_INVENTORY','INVENTORY_RESERVED','PAYMENT_PROCESSING','INVENTORY_REJECTED','PAYMENT_FAILED','CONFIRMED','CANCELLED','PACKING','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','RETURN_REQUESTED','RETURNED']);
  protected readonly filteredOrders=computed(()=>this.orders());
  protected readonly orderPageCount=computed(()=>this.pageCount(this.orderTotal()));
  protected readonly visibleOrders=computed(()=>this.orders());
  protected readonly userPageCount=computed(()=>this.pageCount(this.userTotal()));
  protected readonly visibleUsers=computed(()=>this.users());

  constructor(){
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params=>{
      this.section.set(params.get('section') ?? 'overview');
      this.load();
    });
  }

  protected load(): void {
    const generation = ++this.loadGeneration;
    this.loading.set(true);
    this.error.set('');
    this.optionalWarning.set('');

    if (this.section() === 'orders') {
      this.adminApi.loadAdminOrders(
        this.orderPage() - 1,
        this.pageSize,
        this.orderSearch(),
        this.orderStatusFilter(),
        this.orderSortField(),
        this.orderSortDirection(),
      ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (page) => {
          if (generation !== this.loadGeneration) return;
          this.orders.set(page.content);
          this.orderTotal.set(page.totalElements ?? page.content.length);
          this.loading.set(false);
        },
        error: () => { if (generation === this.loadGeneration) this.fail(); },
      });
      return;
    }

    if (this.section() === 'users') {
      this.adminApi.loadUsers(this.userPage() - 1, this.pageSize, this.userSearch()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (users) => {
          if (generation !== this.loadGeneration) return;
          this.users.set(users.content);
          this.userTotal.set(users.totalElements ?? users.content.length);
          this.loading.set(false);
        },
        error: () => { if (generation === this.loadGeneration) this.fail(); },
      });
      return;
    }

    this.adminApi.loadOverview().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({orders, users, inventory, payments, orderDeadLetters, inventoryDeadLetters, paymentDeadLetters})=>{
        if (generation !== this.loadGeneration) return;
        this.orders.set(orders);
        this.users.set(users.content);
        this.userTotal.set(users.totalElements ?? users.content.length);
        this.inventory.set(inventory.data);
        this.payments.set(payments.data);
        this.inventoryAvailable.set(inventory.available);
        this.paymentsAvailable.set(payments.available);
        this.recoveryAvailable.set(orderDeadLetters.available && inventoryDeadLetters.available && paymentDeadLetters.available);
        this.failedEvents.set([
          ...orderDeadLetters.data.map(event=>({...event,service:'Orders'})),
          ...inventoryDeadLetters.data.map(event=>({...event,service:'Inventory'})),
          ...paymentDeadLetters.data.map(event=>({...event,service:'Payments'})),
        ]);
        const unavailable = [
          ...(!inventory.available ? ['inventory'] : []),
          ...(!payments.available ? ['payments'] : []),
          ...(!this.recoveryAvailable() ? ['one or more recovery sources'] : []),
        ];
        if (unavailable.length) this.optionalWarning.set(`Some dashboard data could not be loaded: ${unavailable.join(', ')}. Displayed counts may be incomplete.`);
        this.loading.set(false);
      },
      error:()=>{ if (generation === this.loadGeneration) this.fail(); },
    });
  }

  protected price(value:number): string {
    return formatInr(value);
  }

  protected percent(value:number,total:number): number {
    if(!total) return 0;
    return Math.round((value/total)*100);
  }

  protected pageLabel(total:number,page:number): string {
    if(!total) return '0 records';
    const safePage=this.clampedPage(page,this.pageCount(total));
    const start=(safePage-1)*this.pageSize+1;
    const end=Math.min(start+this.pageSize-1,total);
    return `${start}-${end} of ${total}`;
  }

  protected goToOrderPage(target:number): void {
    const next = this.clampedPage(target,this.orderPageCount());
    if (next === this.orderPage()) return;
    this.orderPage.set(next);
    this.load();
  }

  protected updateOrderFilters(): void {
    this.orderPage.set(1);
    this.load();
  }

  protected searchOrders(): void {
    this.orderSearch.set(this.orderSearchDraft.trim());
    this.updateOrderFilters();
  }

  protected goToUserPage(target:number): void {
    const nextPage = this.clampedPage(target, this.userPageCount());
    if (nextPage === this.userPage()) return;
    this.userPage.set(nextPage);
    this.load();
  }

  protected searchUsers(): void {
    this.userSearch.set(this.userSearchDraft.trim());
    this.userPage.set(1);
    this.load();
  }

  private orderSortField(): string {
    switch (this.orderSort()) {
      case 'oldest': return 'createdAt';
      case 'amountDesc': case 'amountAsc': return 'totalAmount';
      case 'status': return 'status';
      case 'customer': return 'customerUsername';
      case 'orderNumber': return 'orderNumber';
      default: return 'createdAt';
    }
  }

  private orderSortDirection(): 'ASC' | 'DESC' {
    return this.orderSort() === 'oldest' || this.orderSort() === 'amountAsc' ? 'ASC' : 'DESC';
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Sign out?',
      message: 'You will leave the operations workspace.',
      confirmText: 'Sign out',
    });
    if (!confirmed) return;
    this.session.logoutFromServer().subscribe({
      next: () => { this.toast.info('Signed out.'); this.router.navigateByUrl('/'); },
      error: () => this.toast.error('Sign out failed. Please check your connection and try again.'),
    });
  }

  private slices(values:string[]): StatusSlice[] {
    const total=values.length;
    const counts=values.reduce<Record<string,number>>((acc,status)=>{
      acc[status]=(acc[status] ?? 0)+1;
      return acc;
    },{});
    return Object.entries(counts)
      .map(([status,count])=>({status,count,percent:this.percent(count,total)}))
      .sort((a,b)=>b.count-a.count);
  }

  private pageCount(total:number): number {
    return Math.max(1, Math.ceil(total/this.pageSize));
  }

  private clampedPage(page:number,pageCount:number): number {
    return Math.min(Math.max(1,page),pageCount);
  }

  private fail(): void {
    this.error.set(APP_MESSAGES.errors.operationsUnavailable);
    this.loading.set(false);
  }
}
