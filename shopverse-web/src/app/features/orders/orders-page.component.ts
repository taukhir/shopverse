import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Order { id: number; orderNumber: string; status: string; totalAmount: number; createdAt: string; items?: Array<{ productName: string; quantity: number }>; }

@Component({
  selector: 'app-orders-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
})
export class OrdersPageComponent {
  private readonly http = inject(HttpClient);
  protected readonly orders = signal<Order[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.http.get<Order[]>('/api/v1/orders').subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected price(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  protected itemLabel(order: Order): string {
    const count = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    return count === 1 ? '1 item' : `${count} items`;
  }
}
