import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no messages', () => {
    expect(service.messages()).toEqual([]);
  });

  it('success/error/info push a message with the matching tone', () => {
    service.success('ok');
    service.error('bad');
    service.info('fyi');
    expect(service.messages().map((message) => message.tone)).toEqual(['success', 'error', 'info']);
    expect(service.messages().map((message) => message.message)).toEqual(['ok', 'bad', 'fyi']);
  });

  it('assigns increasing ids to each message', () => {
    service.success('one');
    service.success('two');
    const [first, second] = service.messages();
    expect(second.id).toBeGreaterThan(first.id);
  });

  it('keeps only the most recent 4 messages', () => {
    for (let i = 0; i < 6; i += 1) service.info(`message-${i}`);
    expect(service.messages()).toHaveLength(4);
    expect(service.messages().map((message) => message.message)).toEqual([
      'message-2',
      'message-3',
      'message-4',
      'message-5',
    ]);
  });

  it('dismiss() removes a message by id', () => {
    service.success('one');
    const id = service.messages()[0].id;
    service.dismiss(id);
    expect(service.messages()).toEqual([]);
  });

  it('dismiss() on an unknown id is a no-op', () => {
    service.success('one');
    service.dismiss(9999);
    expect(service.messages()).toHaveLength(1);
  });

  it('auto-dismisses a message after the timeout', () => {
    service.success('one');
    expect(service.messages()).toHaveLength(1);
    vi.advanceTimersByTime(4200);
    expect(service.messages()).toHaveLength(0);
  });
});
