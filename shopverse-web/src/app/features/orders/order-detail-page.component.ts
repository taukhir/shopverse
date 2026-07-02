import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  correlationId: string;
  idempotencyKey: string;
  customerUsername: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

interface TimelineEvent {
  orderNumber: string;
  correlationId: string;
  stage: string;
  detail: string;
  occurredAt: string;
}

@Component({
  selector: 'app-order-detail-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.scss',
})
export class OrderDetailPageComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  protected readonly order = signal<Order | null>(null);
  protected readonly timeline = signal<TimelineEvent[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');

  constructor() {
    this.load();
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('error');
      return;
    }
    this.state.set('loading');
    this.http.get<Order>(`/api/v1/orders/${id}`).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadTimeline(order.id);
      },
      error: () => this.state.set('error'),
    });
  }

  protected price(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  protected cleanStage(stage: string): string {
    return stage.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private loadTimeline(orderId: number): void {
    this.http.get<TimelineEvent[]>(`/api/v1/orders/${orderId}/timeline`).subscribe({
      next: (timeline) => {
        this.timeline.set(timeline);
        this.state.set('ready');
      },
      error: () => {
        this.timeline.set([]);
        this.state.set('ready');
      },
    });
  }
}
