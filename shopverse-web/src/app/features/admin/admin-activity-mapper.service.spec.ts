import { describe, expect, it } from 'vitest';

import { AdminActivityMapperService } from './admin-activity-mapper.service';

const mapper = new AdminActivityMapperService();

describe('AdminActivityMapperService', () => {
  it('maps source collections directly into one event list and omits healthy inventory rows', () => {
    const events = mapper.fromSources({
      orders: [{ id: 1, orderNumber: 'ORD-1', customerUsername: 'sam', status: 'CONFIRMED', totalAmount: 125 }],
      payments: [
        { id: 2, orderNumber: 'ORD-1', amount: 125, status: 'DECLINED', failureReason: 'Card declined', updatedAt: '' },
      ],
      inventory: [
        {
          productId: 3,
          productName: 'Available',
          category: 'Tech',
          availableQuantity: 12,
          reservedQuantity: 0,
          available: true,
          unitPrice: 1,
        },
        {
          productId: 4,
          productName: 'Low stock',
          category: 'Tech',
          availableQuantity: 2,
          reservedQuantity: 1,
          available: true,
          unitPrice: 1,
        },
      ],
      orderDeadLetters: [
        {
          id: 5,
          sourceTopic: 'orders',
          failureReason: 'Order event failed',
          retryCount: 0,
          replayed: false,
          replayCount: 0,
          failedAt: '',
          replayedAt: null,
        },
      ],
      inventoryDeadLetters: [],
      paymentDeadLetters: [],
    });

    expect(events.map((event) => event.id)).toEqual(['order-1', 'payment-2', 'inventory-4', 'recovery-Orders-5']);
    expect(events[0]).toMatchObject({ area: 'ORDERS', result: 'SUCCESS', link: '/admin/orders/1' });
    expect(events[1]).toMatchObject({ area: 'PAYMENTS', result: 'FAILED', description: 'Card declined' });
    expect(events[3]).toMatchObject({ actor: 'orders', status: 'ACTION_REQUIRED' });
  });

  it('normalizes audit labels and derives detail links from subject identity', () => {
    const [event] = mapper.fromAuditEvents([
      {
        id: 7,
        area: 'orders',
        actor: 'admin',
        result: 'WARNING',
        occurredAt: '2025-01-01T00:00:00Z',
        subjectType: 'ORDER',
        subjectId: 99,
        metadata: { source: 'test' },
      },
    ]);

    expect(event).toMatchObject({
      area: 'ORDERS',
      result: 'ATTENTION',
      link: '/admin/orders/99',
      meta: 'source: test',
    });
  });
});
