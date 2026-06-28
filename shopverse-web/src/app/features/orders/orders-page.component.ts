import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Order { id: number; orderNumber: string; status: string; totalAmount: number; createdAt: string; }

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, DatePipe],
  template: `<section class="page"><p>YOUR ORDERS</p><h1>Order history.</h1>@if(state()==='loading'){<div class="notice">Loading your order history...</div>}@else if(state()==='error'){<div class="notice">We could not load your orders. <button (click)="load()">Try again</button></div>}@else if(!orders().length){<div class="notice"><h2>No orders yet.</h2><span>Your confirmed orders will appear here.</span><a routerLink="/products">Browse the collection</a></div>}@else{<div class="orders">@for(order of orders();track order.id){<article><div><p>{{ order.orderNumber }}</p><h2>{{ order.status }}</h2><span>{{ order.createdAt | date:'mediumDate' }}</span></div><strong>{{ price(order.totalAmount) }}</strong></article>}</div>}</section>`,
  styles: `.page{max-width:var(--max-width);min-height:calc(100dvh - 188px);margin:auto;padding:100px 24px}.page>p,article p{color:var(--muted);font-size:10px;font-weight:800;letter-spacing:.13em}.page>h1{margin:18px 0 50px;font-size:clamp(48px,7vw,94px);letter-spacing:-.08em;line-height:.9}.notice{max-width:600px;padding:34px;color:var(--white);background:var(--ink-soft)}.notice h2{margin:0;font-size:30px}.notice span{display:block;margin-top:8px;color:var(--accent-soft)}.notice a{display:inline-block;margin-top:23px;color:var(--white);border-bottom:1px solid var(--white);font-size:12px;font-weight:800}.notice button{margin-left:7px;padding:0;color:var(--accent-soft);border:0;background:none;font-weight:800}.orders{border-top:1px solid var(--line)}article{display:flex;align-items:center;justify-content:space-between;padding:25px 4px;border-bottom:1px solid var(--line)}article p{margin:0 0 8px}article h2{margin:0;font-size:21px;letter-spacing:-.04em}article span{color:var(--muted);font-size:12px}article strong{font-size:15px}`,
})
export class OrdersPageComponent { private readonly http=inject(HttpClient); protected readonly orders=signal<Order[]>([]); protected readonly state=signal<'loading'|'ready'|'error'>('loading'); constructor(){this.load();} protected load(){this.state.set('loading');this.http.get<Order[]>('/api/v1/orders').subscribe({next:o=>{this.orders.set(o);this.state.set('ready')},error:()=>this.state.set('error')})} protected price(value:number){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value)} }
