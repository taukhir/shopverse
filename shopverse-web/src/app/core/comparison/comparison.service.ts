import { Injectable, computed, signal } from '@angular/core';

const COMPARISON_KEY = 'shopverse.product-comparison.v1';
const MAX_PRODUCTS = 3;

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private readonly ids = signal<number[]>(this.readIds());
  readonly productIds = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);
  readonly limit = MAX_PRODUCTS;

  contains(productId: number): boolean { return this.ids().includes(productId); }

  toggle(productId: number): 'added' | 'removed' | 'limit' {
    if (!Number.isSafeInteger(productId) || productId < 1) return 'limit';
    if (this.contains(productId)) {
      this.write(this.ids().filter((id) => id !== productId));
      return 'removed';
    }
    if (this.count() >= MAX_PRODUCTS) return 'limit';
    this.write([...this.ids(), productId]);
    return 'added';
  }

  remove(productId: number): void { this.write(this.ids().filter((id) => id !== productId)); }
  clear(): void { this.write([]); }

  private readIds(): number[] {
    if (typeof window === 'undefined') return [];
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(COMPARISON_KEY) ?? '[]');
      return Array.isArray(parsed)
        ? [...new Set(parsed.filter((id): id is number => Number.isSafeInteger(id) && id > 0))].slice(0, MAX_PRODUCTS)
        : [];
    } catch { return []; }
  }

  private write(ids: number[]): void {
    this.ids.set(ids);
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(COMPARISON_KEY, JSON.stringify(ids)); } catch { /* Keep the in-memory comparison usable. */ }
  }
}
