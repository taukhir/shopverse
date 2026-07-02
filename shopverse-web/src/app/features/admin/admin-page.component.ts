import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { SessionService } from '../../core/auth/session.service';

interface Order { id:number; orderNumber:string; customerUsername:string; status:string; totalAmount:number; createdAt?:string; }
interface User { id:number; username:string; email:string; firstName:string; lastName:string; status:string; roles:string[]; }
interface InventoryItem { productId:number; productName:string; category:string; availableQuantity:number; reservedQuantity:number; available:boolean; unitPrice:number; updatedAt?:string; }
interface Payment { id:number; orderNumber:string; amount:number; status:string; failureReason:string|null; updatedAt:string; }
interface FailedEvent { id:number; sourceTopic:string; failureReason:string; retryCount:number; replayed:boolean; replayCount:number; failedAt:string; replayedAt:string|null; service?:string; }
interface Page<T> { content:T[]; totalElements:number; }
interface StatusSlice { status:string; count:number; percent:number; }

@Component({
  selector:'app-admin-page',
  imports:[RouterLink,RouterLinkActive],
  templateUrl:'./admin-page.component.html',
  styleUrl:'./admin-page.component.scss',
})
export class AdminPageComponent {
  private readonly route=inject(ActivatedRoute);
  private readonly http=inject(HttpClient);
  private readonly router=inject(Router);
  protected readonly session=inject(SessionService);

  protected readonly section=signal(this.route.snapshot.paramMap.get('section') ?? 'overview');
  protected readonly orders=signal<Order[]>([]);
  protected readonly users=signal<User[]>([]);
  protected readonly userTotal=signal(0);
  protected readonly inventory=signal<InventoryItem[]>([]);
  protected readonly payments=signal<Payment[]>([]);
  protected readonly failedEvents=signal<FailedEvent[]>([]);
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

  constructor(){
    this.route.paramMap.subscribe(params=>{
      this.section.set(params.get('section') ?? 'overview');
      this.load();
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.optionalWarning.set('');

    forkJoin({
      orders: this.http.get<Order[]>('/api/v1/orders/admin/all'),
      users: this.http.get<Page<User>>('/api/v1/users?size=12'),
      inventory: this.http.get<InventoryItem[]>('/api/v1/inventory/public/items').pipe(catchError(()=>of([] as InventoryItem[]))),
      payments: this.http.get<Payment[]>('/api/v1/payments/admin').pipe(catchError(()=>of([] as Payment[]))),
      orderDeadLetters: this.http.get<FailedEvent[]>('/api/v1/orders/admin/dead-letters').pipe(catchError(()=>of([] as FailedEvent[]))),
      inventoryDeadLetters: this.http.get<FailedEvent[]>('/api/v1/inventory/admin/dead-letters').pipe(catchError(()=>of([] as FailedEvent[]))),
      paymentDeadLetters: this.http.get<FailedEvent[]>('/api/v1/payments/admin/dead-letters').pipe(catchError(()=>of([] as FailedEvent[]))),
    }).subscribe({
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
          this.optionalWarning.set('Some operational widgets may be empty if Inventory or Payment Service is offline or has no records yet.');
        }
        this.loading.set(false);
      },
      error:()=>this.fail(),
    });
  }

  protected price(value:number): string {
    return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
  }

  protected percent(value:number,total:number): number {
    if(!total) return 0;
    return Math.round((value/total)*100);
  }

  protected logout(): void {
    this.session.logout();
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

  private fail(): void {
    this.error.set('Operations data is unavailable. Confirm the backend services are running and this account has administrator permissions.');
    this.loading.set(false);
  }
}
