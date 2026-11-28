import { describe, expect, it } from 'vitest';

import { AdminDashboardMetricsService } from './admin-dashboard-metrics.service';

const service = new AdminDashboardMetricsService();

const order = (
  overrides: Partial<Parameters<AdminDashboardMetricsService['summarize']>[0]['orders'][number]> = {},
) => ({
  id: 1,
  orderNumber: 'ORD-1',
  customerUsername: 'customer',
  status: 'CONFIRMED',
  totalAmount: 200,
  createdAt: '2025-01-09T12:00:00Z',
  ...overrides,
});

const inventoryItem = (
  overrides: Partial<Parameters<AdminDashboardMetricsService['summarize']>[0]['inventory'][number]> = {},
) => ({
  productId: 1,
  productName: 'Product',
  category: 'Tech',
  availableQuantity: 2,
  reservedQuantity: 1,
  available: true,
  unitPrice: 50,
  ...overrides,
});

const payment = (
  overrides: Partial<Parameters<AdminDashboardMetricsService['summarize']>[0]['payments'][number]> = {},
) => ({
  id: 1,
  orderNumber: 'ORD-1',
  amount: 200,
  status: 'CAPTURED',
  failureReason: null,
  updatedAt: '2025-01-10T12:00:00Z',
  ...overrides,
});

describe('AdminDashboardMetricsService', () => {
  it('summarizes operational collections and a bounded seven-day trend', () => {
    const summary = service.summarize(
      {
        orders: [order(), order({ id: 2, status: 'CANCELLED', totalAmount: 100, createdAt: '2025-01-10T08:00:00Z' })],
        inventory: [
          inventoryItem(),
          inventoryItem({ productId: 2, availableQuantity: 0, reservedQuantity: 0, available: false }),
        ],
        payments: [payment(), payment({ id: 2, status: 'DECLINED', amount: 100 })],
        failedEvents: [
          {
            id: 1,
            sourceTopic: 'orders',
            failureReason: 'first',
            retryCount: 0,
            replayed: false,
            replayCount: 0,
            failedAt: '2025-01-09T00:00:00Z',
            replayedAt: null,
          },
          {
            id: 2,
            sourceTopic: 'orders',
            failureReason: 'done',
            retryCount: 1,
            replayed: true,
            replayCount: 1,
            failedAt: '2025-01-08T00:00:00Z',
            replayedAt: '2025-01-09T00:00:00Z',
          },
        ],
        inventoryAvailable: true,
        paymentsAvailable: true,
      },
      new Date('2025-01-10T12:00:00Z'),
    );

    expect(summary.openOrderCount).toBe(1);
    expect(summary.orderRevenue).toBe(300);
    expect(summary.inventoryTotals).toEqual({ items: 2, available: 2, reserved: 1, lowStock: 1, outOfStock: 1 });
    expect(summary.paymentTotals).toMatchObject({ total: 2, captured: 1, failed: 1, amount: 300 });
    expect(summary.recoverableEventCount).toBe(1);
    expect(summary.orderVolumeTrend).toMatchObject({ timestampCount: 2, recentCount: 2 });
    expect(summary.orderVolumeTrend.days).toHaveLength(7);
    expect(summary.orderStatusSlices[0]).toMatchObject({ status: 'CONFIRMED', count: 1, percent: 50 });
  });

  it('distinguishes unavailable sources from available empty sources', () => {
    const summary = service.summarize(
      {
        orders: [],
        inventory: [],
        payments: [],
        failedEvents: [],
        inventoryAvailable: false,
        paymentsAvailable: false,
      },
      new Date('2025-01-10T12:00:00Z'),
    );

    expect(summary.overviewMetrics.find((metric) => metric.label === 'Payment capture rate')?.value).toBe(
      'Unavailable',
    );
    expect(summary.overviewMetrics.find((metric) => metric.label === 'Catalog availability')?.value).toBe(
      'Unavailable',
    );
    expect(summary.orderVolumeTrend.recentCount).toBe(0);
  });
});
