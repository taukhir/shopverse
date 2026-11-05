import { describe, expect, it } from 'vitest';

import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  it('has no pending confirmation initially', () => {
    const service = new ConfirmService();
    expect(service.state()).toBeNull();
  });

  it('confirm() populates state with defaults and resolves true on answer(true)', async () => {
    const service = new ConfirmService();
    const pending = service.confirm({ title: 'Delete', message: 'Are you sure?' });

    expect(service.state()).toMatchObject({
      title: 'Delete',
      message: 'Are you sure?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      tone: 'normal',
    });

    service.answer(true);
    await expect(pending).resolves.toBe(true);
    expect(service.state()).toBeNull();
  });

  it('resolves false on answer(false)', async () => {
    const service = new ConfirmService();
    const pending = service.confirm({ title: 'Delete', message: 'Are you sure?', tone: 'danger' });
    expect(service.state()?.tone).toBe('danger');
    service.answer(false);
    await expect(pending).resolves.toBe(false);
  });

  it('honors custom confirm/cancel text', () => {
    const service = new ConfirmService();
    service.confirm({ title: 'Ship', message: 'Ship it?', confirmText: 'Ship', cancelText: 'Not yet' });
    expect(service.state()).toMatchObject({ confirmText: 'Ship', cancelText: 'Not yet' });
    service.answer(true);
  });

  it('answer() without a pending confirmation is a no-op', () => {
    const service = new ConfirmService();
    expect(() => service.answer(true)).not.toThrow();
    expect(service.state()).toBeNull();
  });
});
