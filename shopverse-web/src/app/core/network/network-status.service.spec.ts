import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts online and hidden when the browser reports online', () => {
    const service = new NetworkStatusService();
    expect(service.status().state).toBe('online');
    expect(service.isVisible()).toBe(false);
  });

  it('starts offline and visible when the browser reports offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const service = new NetworkStatusService();
    expect(service.status().state).toBe('offline');
    expect(service.isVisible()).toBe(true);
  });

  it('requestSlow() surfaces a slow banner while online', () => {
    const service = new NetworkStatusService();
    service.requestSlow();
    expect(service.status().state).toBe('slow');
    expect(service.isVisible()).toBe(true);
  });

  it('requestSlow() does nothing once already degraded', () => {
    const service = new NetworkStatusService();
    service.requestFailed(500);
    service.requestSlow();
    expect(service.status().state).toBe('degraded');
  });

  it('requestFailed(0) marks the connection offline', () => {
    const service = new NetworkStatusService();
    service.requestFailed(0);
    expect(service.status().state).toBe('offline');
  });

  it('requestFailed() with a 5xx/408/429 status marks the connection degraded', () => {
    const service = new NetworkStatusService();
    service.requestFailed(503);
    expect(service.status().state).toBe('degraded');
  });

  it('requestFailed() with a normal client error leaves state untouched', () => {
    const service = new NetworkStatusService();
    service.requestFailed(404);
    expect(service.status().state).toBe('online');
  });

  it('requestSucceeded() recovers from slow/degraded back to online and auto-hides', () => {
    const service = new NetworkStatusService();
    service.requestSlow();
    service.requestSucceeded();
    expect(service.status().state).toBe('online');
    expect(service.isVisible()).toBe(true);

    vi.advanceTimersByTime(2600);
    expect(service.isVisible()).toBe(false);
  });

  it('requestSucceeded() while offline does not clear the offline banner', () => {
    const service = new NetworkStatusService();
    service.requestFailed(0);
    service.requestSucceeded();
    expect(service.status().state).toBe('offline');
  });

  it('requestStarted() flips to offline if the browser is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const service = new NetworkStatusService();
    service.requestStarted();
    expect(service.status().state).toBe('offline');
  });

  it('dismiss() hides a visible non-offline banner', () => {
    const service = new NetworkStatusService();
    service.requestSlow();
    service.dismiss();
    expect(service.isVisible()).toBe(false);
  });

  it('dismiss() is a no-op while offline', () => {
    const service = new NetworkStatusService();
    service.requestFailed(0);
    service.dismiss();
    expect(service.isVisible()).toBe(true);
  });
});
