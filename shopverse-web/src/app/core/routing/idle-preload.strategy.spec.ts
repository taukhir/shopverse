import { Route } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdlePreloadStrategy } from './idle-preload.strategy';

describe('IdlePreloadStrategy', () => {
  let strategy: IdlePreloadStrategy;

  beforeEach(() => {
    strategy = new IdlePreloadStrategy();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('does not preload a route without data.preload = true', () => {
    const load = vi.fn(() => of('loaded'));
    const values: unknown[] = [];
    strategy.preload({} as Route, load).subscribe((value) => values.push(value));

    expect(load).not.toHaveBeenCalled();
    expect(values).toEqual([null]);
  });

  it('loads the route via requestIdleCallback when available', () => {
    const requestIdleCallback = vi.fn((callback: () => void) => { callback(); return 1; });
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal('requestIdleCallback', requestIdleCallback);
    vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);

    const load = vi.fn(() => of('loaded'));
    const values: unknown[] = [];
    strategy.preload({ data: { preload: true } } as Route, load).subscribe((value) => values.push(value));

    expect(requestIdleCallback).toHaveBeenCalledOnce();
    expect(load).toHaveBeenCalledOnce();
    expect(values).toEqual(['loaded']);
  });

  it('falls back to a timeout when requestIdleCallback is unavailable', () => {
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);

    const load = vi.fn(() => of('loaded'));
    const values: unknown[] = [];
    strategy.preload({ data: { preload: true } } as Route, load).subscribe((value) => values.push(value));

    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1200);
    expect(load).toHaveBeenCalledOnce();
    expect(values).toEqual(['loaded']);
  });

  it('cancels the idle callback on unsubscribe before it fires', () => {
    const cancelIdleCallback = vi.fn();
    vi.stubGlobal('requestIdleCallback', vi.fn(() => 42));
    vi.stubGlobal('cancelIdleCallback', cancelIdleCallback);

    const load = vi.fn(() => of('loaded'));
    const subscription = strategy.preload({ data: { preload: true } } as Route, load).subscribe();
    subscription.unsubscribe();

    expect(cancelIdleCallback).toHaveBeenCalledWith(42);
    expect(load).not.toHaveBeenCalled();
  });
});
