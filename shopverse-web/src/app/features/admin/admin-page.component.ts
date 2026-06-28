import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';

interface Order { id:number; orderNumber:string; customerUsername:string; status:string; totalAmount:number; }
interface User { id:number; username:string; email:string; firstName:string; lastName:string; status:string; roles:string[]; }
interface Page<T> { content:T[]; totalElements:number; }

@Component({ selector:'app-admin-page', imports:[RouterLink,RouterLinkActive], templateUrl:'./admin-page.component.html', styleUrl:'./admin-page.component.scss' })
export class AdminPageComponent {
  private readonly route=inject(ActivatedRoute); private readonly http=inject(HttpClient); private readonly router=inject(Router); protected readonly session=inject(SessionService);
  protected readonly section=signal(this.route.snapshot.paramMap.get('section') ?? 'overview'); protected readonly orders=signal<Order[]>([]); protected readonly users=signal<User[]>([]); protected readonly loading=signal(true); protected readonly error=signal('');
  protected readonly openOrderCount=computed(()=>this.orders().filter(order=>order.status!=='CONFIRMED').length);
  constructor(){this.route.paramMap.subscribe(params=>{this.section.set(params.get('section') ?? 'overview');this.load();});}
  protected load(){this.loading.set(true);this.error.set('');this.http.get<Order[]>('/api/v1/orders/admin/all').subscribe({next:orders=>{this.orders.set(orders);this.http.get<Page<User>>('/api/v1/users?size=12').subscribe({next:users=>{this.users.set(users.content);this.loading.set(false)},error:()=>this.fail()})},error:()=>this.fail()});}
  protected price(value:number){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value)}
  protected logout(){this.session.logout();this.router.navigateByUrl('/');}
  private fail(){this.error.set('Operations data is unavailable. Confirm the backend services are running and this account has administrator permissions.');this.loading.set(false);}
}
