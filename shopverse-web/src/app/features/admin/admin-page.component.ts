import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { compareNumber, compareText, uniqueSorted } from '../../shared/utils/collection';
import { formatInr } from '../../shared/utils/formatters';
import { AdminApiService, AdminFailedEvent, AdminInventoryItem, AdminOrder, AdminPayment, AdminUser } from './admin-api.service';

interface StatusSlice { status:string; count:number; percent:number; }

@Component({
  selector:'app-admin-page',
  imports:[EmptyStateComponent,FormsModule,LoadingSkeletonComponent,RouterLink,RouterLinkActive,ServiceNoticeComponent],
  templateUrl:'./admin-page.component.html',
  styleUrl:'./admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {
  private readonly route=inject(ActivatedRoute);
  private readonly adminApi=inject(AdminApiService);
  private readonly confirm=inject(ConfirmService);
  private readonly router=inject(Router);
  protected readonly session=inject(SessionService);
  private readonly toast=inject(ToastService);

  protected readonly section=signal(this.route.snapshot.paramMap.get('section') ?? 'overview');
  protected readonly orders=signal<AdminOrder[]>([]);
  protected readonly users=signal<AdminUser[]>([]);
  protected readonly userTotal=signal(0);
  protected readonly inventory=signal<AdminInventoryItem[]>([]);
  protected readonly payments=signal<AdminPayment[]>([]);
  protected readonly failedEvents=signal<AdminFailedEvent[]>([]);
  protected readonly orderSearch=signal('');
  protected readonly orderStatusFilter=signal('ALL');
  protected readonly orderSort=signal<'newest'|'oldest'|'amountDesc'|'amountAsc'|'status'|'customer'|'orderNumber'>('newest');
  protected readonly orderPage=signal(1);
  protected readonly userPage=signal(1);
  protected readonly pageSize=8;
  protected readonly optionalWarning=signal('');
  protected readonly loading=signal(true);
  protected readonly error=signal('');

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
  protected readonly orderStatuses=computed(()=>['ALL',...uniqueSorted(this.orders().map(order=>order.status))]);
  protected readonly filteredOrders=computed(()=>{
    const query=this.orderSearch().trim().toLowerCase();
    const status=this.orderStatusFilter();
    const orders=this.orders().filter(order=>{
      const matchesStatus=status==='ALL' || order.status===status;
      const haystack=`${order.orderNumber} ${order.customerUsername}`.toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
    return [...orders].sort((a,b)=>{
      switch(this.orderSort()){
        case 'oldest': return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'amountDesc': return compareNumber(b.totalAmount, a.totalAmount);
        case 'amountAsc': return compareNumber(a.totalAmount, b.totalAmount);
        case 'status': return compareText(a.status, b.status);
        case 'customer': return compareText(a.customerUsername, b.customerUsername);
        case 'orderNumber': return compareText(a.orderNumber, b.orderNumber);
        default: return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });
  });
  protected readonly orderPageCount=computed(()=>this.pageCount(this.filteredOrders().length));
  protected readonly visibleOrders=computed(()=>{
    const page=this.clampedPage(this.orderPage(), this.orderPageCount());
    const start=(page-1)*this.pageSize;
    return this.filteredOrders().slice(start,start+this.pageSize);
  });
  protected readonly userPageCount=computed(()=>this.pageCount(this.users().length));
  protected readonly visibleUsers=computed(()=>{
    const page=this.clampedPage(this.userPage(), this.userPageCount());
    const start=(page-1)*this.pageSize;
    return this.users().slice(start,start+this.pageSize);
  });

  constructor(){
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(params=>{
      this.section.set(params.get('section') ?? 'overview');
      this.load();
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.optionalWarning.set('');

    this.adminApi.loadOverview().subscribe({
      next: ({orders, users, inventory, payments, orderDeadLetters, inventoryDeadLetters, paymentDeadLetters})=>{
        this.orders.set(orders);
        this.users.set(users.content);
        this.userTotal.set(users.totalElements ?? users.content.length);
        this.inventory.set(inventory);
        this.payments.set(payments);
        this.failedEvents.set([
          ...orderDeadLetters.map(event=>({...event,service:'Orders'})),
          ...inventoryDeadLetters.map(event=>({...event,service:'Inventory'})),
          ...paymentDeadLetters.map(event=>({...event,service:'Payments'})),
        ]);
        if(!inventory.length || !payments.length){
          this.optionalWarning.set(APP_MESSAGES.warnings.partialAdminData);
        }
        this.loading.set(false);
      },
      error:()=>this.fail(),
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

  protected changeOrderPage(delta:number): void {
    this.orderPage.set(this.clampedPage(this.orderPage()+delta,this.orderPageCount()));
  }

  protected changeUserPage(delta:number): void {
    this.userPage.set(this.clampedPage(this.userPage()+delta,this.userPageCount()));
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
