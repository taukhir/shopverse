import { Injectable } from '@angular/core';

import { formatInr } from '../../shared/utils/formatters';
import { AdminAuditEvent, AdminFailedEvent, AdminInventoryItem, AdminOrder, AdminPayment } from './admin-api.service';

export type ActivityArea = 'ALL' | 'ORDERS' | 'INVENTORY' | 'PAYMENTS' | 'RECOVERY' | 'USERS';
export type ActivityResult = 'ALL' | 'SUCCESS' | 'ATTENTION' | 'FAILED' | 'PENDING';

export interface AdminActivityEvent {
  id: string;
  area: Exclude<ActivityArea, 'ALL'>;
  title: string;
  description: string;
  actor: string;
  occurredAt: string;
  result: Exclude<ActivityResult, 'ALL'>;
  status: string;
  link?: string;
  meta?: string;
}

export interface AdminActivitySources {
  orders: AdminOrder[];
  inventory: AdminInventoryItem[];
  payments: AdminPayment[];
  orderDeadLetters: AdminFailedEvent[];
  inventoryDeadLetters: AdminFailedEvent[];
  paymentDeadLetters: AdminFailedEvent[];
}

@Injectable({ providedIn: 'root' })
export class AdminActivityMapperService {
  fromSources(sources: AdminActivitySources): AdminActivityEvent[] {
    const events: AdminActivityEvent[] = [];
    for (const order of sources.orders) events.push(this.fromOrder(order));
    for (const payment of sources.payments) events.push(this.fromPayment(payment));
    for (const item of sources.inventory) {
      if (item.availableQuantity >= 5 && item.reservedQuantity === 0 && item.available) continue;
      events.push(this.fromInventoryItem(item));
    }
    for (const event of sources.orderDeadLetters) events.push(this.fromFailedEvent(event, 'Orders'));
    for (const event of sources.inventoryDeadLetters) events.push(this.fromFailedEvent(event, 'Inventory'));
    for (const event of sources.paymentDeadLetters) events.push(this.fromFailedEvent(event, 'Payments'));
    return events;
  }

  fromAuditEvents(events: AdminAuditEvent[]): AdminActivityEvent[] {
    return events.map((event) => {
      const area = this.normalizeArea(event.area);
      const metadata = event.metadata
        ? Object.entries(event.metadata)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(' · ')
        : undefined;
      return {
        id: `audit-${event.id}`,
        area,
        title: event.title || event.action || `${area.toLowerCase()} activity`,
        description: event.description || event.message || 'Audit event recorded by backend.',
        actor: event.actor || 'system',
        occurredAt: event.occurredAt || '',
        result: this.normalizeResult(event.result),
        status: event.status || event.action || event.result,
        link: event.link || this.linkForSubject(event.subjectType, event.subjectId),
        meta:
          metadata || (event.subjectType && event.subjectId ? `${event.subjectType} ${event.subjectId}` : undefined),
      };
    });
  }

  private fromOrder(order: AdminOrder): AdminActivityEvent {
    return {
      id: `order-${order.id}`,
      area: 'ORDERS',
      title: `Order ${order.orderNumber}`,
      description: `Current order state is ${this.clean(order.status)} for ${order.customerUsername}.`,
      actor: order.customerUsername || 'system',
      occurredAt: order.createdAt || '',
      result: this.orderResult(order.status),
      status: order.status,
      link: `/admin/orders/${order.id}`,
      meta: formatInr(order.totalAmount || 0),
    };
  }

  private fromPayment(payment: AdminPayment): AdminActivityEvent {
    return {
      id: `payment-${payment.id}`,
      area: 'PAYMENTS',
      title: `Payment ${payment.orderNumber}`,
      description: payment.failureReason || `Payment state is ${this.clean(payment.status)}.`,
      actor: 'payment-service',
      occurredAt: payment.updatedAt || '',
      result: this.paymentResult(payment.status),
      status: payment.status,
      link: '/admin/payments',
      meta: formatInr(payment.amount || 0),
    };
  }

  private fromInventoryItem(item: AdminInventoryItem): AdminActivityEvent {
    return {
      id: `inventory-${item.productId}`,
      area: 'INVENTORY',
      title: item.productName,
      description: `${item.availableQuantity} available, ${item.reservedQuantity} reserved.`,
      actor: 'inventory-service',
      occurredAt: item.updatedAt || '',
      result: item.availableQuantity === 0 || !item.available ? 'ATTENTION' : 'PENDING',
      status: item.available ? 'LOW_STOCK' : 'UNAVAILABLE',
      link: '/admin/inventory',
      meta: `Product ${item.productId}`,
    };
  }

  private fromFailedEvent(event: AdminFailedEvent, service: string): AdminActivityEvent {
    return {
      id: `recovery-${service}-${event.id}`,
      area: 'RECOVERY',
      title: `${service} dead-letter ${event.id}`,
      description: event.failureReason || 'Failed event awaiting operator review.',
      actor: service.toLowerCase(),
      occurredAt: event.replayedAt || event.failedAt || '',
      result: event.replayed ? 'SUCCESS' : 'FAILED',
      status: event.replayed ? 'REPLAYED' : 'ACTION_REQUIRED',
      link: '/admin/recovery',
      meta: event.sourceTopic,
    };
  }

  private orderResult(status: string): Exclude<ActivityResult, 'ALL'> {
    if (['CANCELLED', 'RETURN_REQUESTED', 'RETURNED'].includes(status)) return 'ATTENTION';
    if (['DELIVERED', 'CONFIRMED', 'PAID'].includes(status)) return 'SUCCESS';
    return 'PENDING';
  }

  private paymentResult(status: string): Exclude<ActivityResult, 'ALL'> {
    if (['DECLINED', 'TIMED_OUT', 'FAILED'].includes(status)) return 'FAILED';
    if (status === 'REFUNDED') return 'ATTENTION';
    if (['CAPTURED', 'RECONCILED'].includes(status)) return 'SUCCESS';
    return 'PENDING';
  }

  private clean(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase();
  }

  private normalizeArea(area: string): Exclude<ActivityArea, 'ALL'> {
    const normalized = area?.toUpperCase();
    if (['ORDERS', 'INVENTORY', 'PAYMENTS', 'RECOVERY', 'USERS'].includes(normalized)) {
      return normalized as Exclude<ActivityArea, 'ALL'>;
    }
    return 'RECOVERY';
  }

  private normalizeResult(result: string): Exclude<ActivityResult, 'ALL'> {
    const normalized = result?.toUpperCase();
    if (['SUCCESS', 'ATTENTION', 'FAILED', 'PENDING'].includes(normalized)) {
      return normalized as Exclude<ActivityResult, 'ALL'>;
    }
    if (normalized === 'ERROR') return 'FAILED';
    if (normalized === 'WARN' || normalized === 'WARNING') return 'ATTENTION';
    return 'PENDING';
  }

  private linkForSubject(subjectType?: string, subjectId?: number | string): string | undefined {
    const type = subjectType?.toUpperCase();
    if (!subjectId) return undefined;
    if (type === 'ORDER') return `/admin/orders/${subjectId}`;
    if (type === 'USER') return `/admin/users/${subjectId}`;
    if (type === 'PAYMENT') return '/admin/payments';
    if (type === 'INVENTORY') return '/admin/inventory';
    return undefined;
  }
}
