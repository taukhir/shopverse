import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'shopverse.recently-viewed.v1';
const MAX_RECENT = 6;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  private readonly ids = signal<number[]>(this.readIds());
  readonly productIds = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);

  record(productId: number): void {
    if (!Number.isSafeInteger(productId) || productId < 1) return;
    this.write([productId, ...this.ids().filter((id) => id !== productId)].slice(0, MAX_RECENT));
  }

  remove(productId: number): void { this.write(this.ids().filter((id) => id !== productId)); }

  clear(): void { this.write([]); }

  private readIds(): number[] {
    if (typeof window === 'undefined') return [];
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) return [];
      return [...new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0))].slice(0, MAX_RECENT);
    } catch { return []; }
  }

  private write(ids: number[]): void {
    this.ids.set(ids);
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* Keep recent products available in memory. */ }
  }
}
