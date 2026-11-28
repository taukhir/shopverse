import { Injectable } from '@angular/core';

import { formatInr } from '../../shared/utils/formatters';
import { AdminFailedEvent, AdminInventoryItem, AdminOrder, AdminPayment } from './admin-api.service';

export interface AdminStatusSlice {
  status: string;
  count: number;
  percent: number;
}

export interface AdminOverviewMetric {
  label: string;
  value: string;
  detail: string;
  percent: number | null;
}

export interface AdminOrderVolumeDay {
  date: string;
  label: string;
  count: number;
  barPercent: number;
}

export interface AdminDashboardMetrics {
  openOrderCount: number;
  orderRevenue: number;
  inventoryTotals: { items: number; available: number; reserved: number; lowStock: number; outOfStock: number };
  inventoryAvailablePercent: number;
  reservedStockPercent: number;
  lowStockItems: AdminInventoryItem[];
  paymentTotals: { total: number; captured: number; pending: number; failed: number; refunded: number; amount: number };
  recoverableEventCount: number;
  recentFailedEvents: AdminFailedEvent[];
  orderStatusSlices: AdminStatusSlice[];
  paymentStatusSlices: AdminStatusSlice[];
  returnRequestCount: number;
  paymentAttentionCount: number;
  overviewMetrics: AdminOverviewMetric[];
  orderVolumeTrend: { days: AdminOrderVolumeDay[]; timestampCount: number; recentCount: number };
}

export interface AdminDashboardMetricsInput {
  orders: AdminOrder[];
  inventory: AdminInventoryItem[];
  payments: AdminPayment[];
  failedEvents: AdminFailedEvent[];
  inventoryAvailable: boolean;
  paymentsAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardMetricsService {
  summarize(input: AdminDashboardMetricsInput, now = new Date()): AdminDashboardMetrics {
    const orderStatuses = new Map<string, number>();
    const paymentStatuses = new Map<string, number>();
    const orderVolumeCounts = new Map<string, number>();
    const firstDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6);
    let orderRevenue = 0;
    let openOrderCount = 0;
    let deliveredOrders = 0;
    let returnRequestCount = 0;
    let timestampCount = 0;

    for (let offset = 0; offset < 7; offset++) {
      orderVolumeCounts.set(new Date(firstDay + offset * 86_400_000).toISOString().slice(0, 10), 0);
    }
    for (const order of input.orders) {
      orderRevenue += Number(order.totalAmount || 0);
      orderStatuses.set(order.status, (orderStatuses.get(order.status) ?? 0) + 1);
      if (!['CANCELLED', 'DELIVERED', 'RETURNED'].includes(order.status)) openOrderCount++;
      if (order.status === 'DELIVERED') deliveredOrders++;
      if (order.status === 'RETURN_REQUESTED') returnRequestCount++;
      if (!order.createdAt) continue;
      const timestamp = Date.parse(order.createdAt);
      if (!Number.isFinite(timestamp)) continue;
      timestampCount++;
      const dateKey = new Date(timestamp).toISOString().slice(0, 10);
      if (orderVolumeCounts.has(dateKey)) orderVolumeCounts.set(dateKey, (orderVolumeCounts.get(dateKey) ?? 0) + 1);
    }

    const inventoryTotals = { items: input.inventory.length, available: 0, reserved: 0, lowStock: 0, outOfStock: 0 };
    let inStockCount = 0;
    const lowStockItems: AdminInventoryItem[] = [];
    for (const item of input.inventory) {
      inventoryTotals.available += Number(item.availableQuantity || 0);
      inventoryTotals.reserved += Number(item.reservedQuantity || 0);
      if (item.availableQuantity > 0 && item.availableQuantity < 5) inventoryTotals.lowStock++;
      if (item.availableQuantity === 0 || !item.available) inventoryTotals.outOfStock++;
      if (item.available && item.availableQuantity > 0) inStockCount++;
      if (item.availableQuantity < 5)
        this.insertTop(lowStockItems, item, 5, (left, right) => left.availableQuantity - right.availableQuantity);
    }

    const paymentTotals = { total: input.payments.length, captured: 0, pending: 0, failed: 0, refunded: 0, amount: 0 };
    let paymentAttentionCount = 0;
    let failedPaymentCount = 0;
    for (const payment of input.payments) {
      paymentStatuses.set(payment.status, (paymentStatuses.get(payment.status) ?? 0) + 1);
      paymentTotals.amount += Number(payment.amount || 0);
      if (payment.status === 'CAPTURED') paymentTotals.captured++;
      if (payment.status === 'PENDING' || payment.status === 'AUTHORIZED') paymentTotals.pending++;
      if (payment.status === 'DECLINED' || payment.status === 'TIMED_OUT') {
        paymentTotals.failed++;
        failedPaymentCount++;
      }
      if (payment.status === 'REFUNDED') paymentTotals.refunded++;
      if (['DECLINED', 'TIMED_OUT', 'PENDING', 'AUTHORIZED'].includes(payment.status)) paymentAttentionCount++;
    }

    const recoverableEventCount = input.failedEvents.reduce((count, event) => count + Number(!event.replayed), 0);
    const recentFailedEvents: AdminFailedEvent[] = [];
    for (const event of input.failedEvents) {
      this.insertTop(recentFailedEvents, event, 5, (left, right) =>
        (right.failedAt || '').localeCompare(left.failedAt || ''),
      );
    }
    const inventoryStockTotal = inventoryTotals.available + inventoryTotals.reserved;
    const inventoryAvailablePercent = this.percent(inventoryTotals.available, inventoryStockTotal);
    const reservedStockPercent = this.percent(inventoryTotals.reserved, inventoryStockTotal);
    const days = [...orderVolumeCounts].map(([date, count]) => ({
      date,
      label: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' }),
      count,
      barPercent: 0,
    }));
    const maxOrderCount = Math.max(0, ...days.map((day) => day.count));
    for (const day of days)
      day.barPercent = maxOrderCount ? Math.max(day.count ? 8 : 0, Math.round((day.count / maxOrderCount) * 100)) : 0;
    const recentCount = days.reduce((total, day) => total + day.count, 0);
    const reservationShare = inventoryStockTotal ? reservedStockPercent : null;

    return {
      openOrderCount,
      orderRevenue,
      inventoryTotals,
      inventoryAvailablePercent,
      reservedStockPercent,
      lowStockItems,
      paymentTotals,
      recoverableEventCount,
      recentFailedEvents,
      orderStatusSlices: this.slices(orderStatuses, input.orders.length),
      paymentStatusSlices: this.slices(paymentStatuses, input.payments.length),
      returnRequestCount,
      paymentAttentionCount,
      overviewMetrics: [
        {
          label: 'Average order value',
          value: input.orders.length ? formatInr(orderRevenue / input.orders.length) : '-',
          detail: input.orders.length ? `Across ${input.orders.length} loaded orders` : 'No order records loaded',
          percent: null,
        },
        {
          label: 'Delivered share',
          value: input.orders.length ? `${this.percent(deliveredOrders, input.orders.length)}%` : '-',
          detail: `${deliveredOrders} of ${input.orders.length} loaded orders delivered`,
          percent: input.orders.length ? this.percent(deliveredOrders, input.orders.length) : null,
        },
        {
          label: 'Payment capture rate',
          value: !input.paymentsAvailable
            ? 'Unavailable'
            : paymentTotals.total
              ? `${this.percent(paymentTotals.captured, paymentTotals.total)}%`
              : '-',
          detail: !input.paymentsAvailable
            ? 'Payment source unavailable'
            : `${paymentTotals.captured} captured of ${paymentTotals.total} loaded payments`,
          percent:
            input.paymentsAvailable && paymentTotals.total
              ? this.percent(paymentTotals.captured, paymentTotals.total)
              : null,
        },
        {
          label: 'Payment failure rate',
          value: !input.paymentsAvailable
            ? 'Unavailable'
            : paymentTotals.total
              ? `${this.percent(failedPaymentCount, paymentTotals.total)}%`
              : '-',
          detail: !input.paymentsAvailable
            ? 'Payment source unavailable'
            : `${failedPaymentCount} failed of ${paymentTotals.total} loaded payments`,
          percent:
            input.paymentsAvailable && paymentTotals.total
              ? this.percent(failedPaymentCount, paymentTotals.total)
              : null,
        },
        {
          label: 'Catalog availability',
          value: !input.inventoryAvailable
            ? 'Unavailable'
            : input.inventory.length
              ? `${this.percent(inStockCount, input.inventory.length)}%`
              : '-',
          detail: !input.inventoryAvailable
            ? 'Inventory source unavailable'
            : `${inStockCount} of ${input.inventory.length} loaded products in stock`,
          percent:
            input.inventoryAvailable && input.inventory.length
              ? this.percent(inStockCount, input.inventory.length)
              : null,
        },
        {
          label: 'Reserved stock share',
          value: !input.inventoryAvailable ? 'Unavailable' : reservationShare === null ? '-' : `${reservationShare}%`,
          detail: !input.inventoryAvailable
            ? 'Inventory source unavailable'
            : `Reserved units out of ${inventoryStockTotal} available or reserved`,
          percent: input.inventoryAvailable ? reservationShare : null,
        },
      ],
      orderVolumeTrend: { days, timestampCount, recentCount },
    };
  }

  private slices(counts: Map<string, number>, total: number): AdminStatusSlice[] {
    return [...counts]
      .map(([status, count]) => ({ status, count, percent: this.percent(count, total) }))
      .sort((left, right) => right.count - left.count);
  }

  private percent(value: number, total: number): number {
    return total ? Math.round((value / total) * 100) : 0;
  }

  private insertTop<T>(items: T[], item: T, limit: number, compare: (left: T, right: T) => number): void {
    const index = items.findIndex((existing) => compare(item, existing) < 0);
    if (index === -1) {
      if (items.length < limit) items.push(item);
    } else {
      items.splice(index, 0, item);
      if (items.length > limit) items.pop();
    }
  }
}
