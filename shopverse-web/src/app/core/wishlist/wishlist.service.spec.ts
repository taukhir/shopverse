import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { WishlistService } from './wishlist.service';

const storageKey = 'shopverse.saved-products.v1';

describe('WishlistService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('starts empty and persists saved product IDs across service instances', () => {
    const service = new WishlistService();
    expect(service.count()).toBe(0);

    expect(service.toggle(101)).toBe(true);
    expect(service.isSaved(101)).toBe(true);
    expect(localStorage.getItem(storageKey)).toBe('[101]');

    const restored = new WishlistService();
    expect(restored.savedIds()).toEqual([101]);
  });

  it('removes saved products and updates the count', () => {
    const service = new WishlistService();
    service.toggle(101);
    service.toggle(102);

    expect(service.toggle(101)).toBe(false);
    expect(service.count()).toBe(1);
    expect(service.savedIds()).toEqual([102]);
  });

  it('ignores invalid IDs and malformed storage', () => {
    localStorage.setItem(storageKey, '{bad json');
    const service = new WishlistService();

    expect(service.savedIds()).toEqual([]);
    expect(service.toggle(0)).toBe(false);
    expect(service.toggle(Number.NaN)).toBe(false);
    expect(service.count()).toBe(0);
  });

  it('deduplicates IDs restored from storage', () => {
    localStorage.setItem(storageKey, '[101,101,102,-1,"103"]');
    expect(new WishlistService().savedIds()).toEqual([101, 102]);
  });
});
