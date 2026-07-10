import { Injectable, computed, signal } from '@angular/core';

type NetworkState = 'online' | 'offline' | 'slow' | 'degraded';

export interface NetworkStatus {
  state: NetworkState;
  message: string;
  detail: string;
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly statusSignal = signal<NetworkStatus>({
    state: this.isBrowserOnline() ? 'online' : 'offline',
    message: this.isBrowserOnline() ? '' : 'You are offline.',
    detail: this.isBrowserOnline() ? '' : 'Check your connection. Some ShopVerse features may not work.',
    visible: !this.isBrowserOnline(),
  });
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly status = this.statusSignal.asReadonly();
  readonly isVisible = computed(() => this.status().visible);

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('offline', () => this.setOffline());
    window.addEventListener('online', () => this.setRecovered());
  }

  requestStarted(): void {
    if (!this.isBrowserOnline()) {
      this.setOffline();
    }
  }

  requestSucceeded(): void {
    if (this.status().state === 'offline') return;
    if (this.status().state === 'slow' || this.status().state === 'degraded') {
      this.setRecovered();
    }
  }

  requestSlow(): void {
    if (!this.isBrowserOnline() || this.status().state === 'degraded') return;
    this.setStatus({
      state: 'slow',
      message: 'ShopVerse is responding slowly.',
      detail: 'You can keep browsing. Some actions may take a little longer.',
      visible: true,
    });
  }

  requestFailed(statusCode: number): void {
    if (!this.isBrowserOnline() || statusCode === 0) {
      this.setOffline();
      return;
    }
    if (statusCode >= 500 || statusCode === 408 || statusCode === 429) {
      this.setStatus({
        state: 'degraded',
        message: 'Some ShopVerse services are temporarily unavailable.',
        detail: 'Retry in a moment. Your cart and current page state are preserved locally.',
        visible: true,
      });
    }
  }

  dismiss(): void {
    if (this.status().state === 'offline') return;
    this.statusSignal.update((status) => ({ ...status, visible: false }));
  }

  private setOffline(): void {
    this.clearRecoveryTimer();
    this.setStatus({
      state: 'offline',
      message: 'You are offline.',
      detail: 'Check your connection. Your cart is saved on this device.',
      visible: true,
    });
  }

  private setRecovered(): void {
    this.setStatus({
      state: 'online',
      message: 'Connection restored.',
      detail: 'ShopVerse is back online.',
      visible: true,
    });
    this.clearRecoveryTimer();
    this.recoveryTimer = setTimeout(() => this.dismiss(), 2600);
  }

  private setStatus(status: NetworkStatus): void {
    this.statusSignal.set(status);
  }

  private clearRecoveryTimer(): void {
    if (!this.recoveryTimer) return;
    clearTimeout(this.recoveryTimer);
    this.recoveryTimer = null;
  }

  private isBrowserOnline(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
  }
}
