import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'shopverse.saved-products.v1';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly ids = signal<number[]>(this.readIds());

  readonly savedIds = this.ids.asReadonly();
  readonly count = computed(() => this.ids().length);

  isSaved(productId: number): boolean {
    return this.ids().includes(productId);
  }

  toggle(productId: number): boolean {
    if (!Number.isSafeInteger(productId) || productId < 1) return false;

    const saved = !this.isSaved(productId);
    this.ids.update((ids) => saved ? [...ids, productId] : ids.filter((id) => id !== productId));
    this.persist();
    return saved;
  }

  remove(productId: number): void {
    this.ids.update((ids) => ids.filter((id) => id !== productId));
    this.persist();
  }

  private readIds(): number[] {
    if (typeof window === 'undefined') return [];
    try {
      const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) return [];
      return [...new Set(value.filter((id): id is number => Number.isSafeInteger(id) && id > 0))];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.ids()));
    } catch {
      // Keep the in-memory list usable when browser storage is unavailable.
    }
  }
}
