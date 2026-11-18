import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, concatMap, of, switchMap } from 'rxjs';

import { API_PATHS } from '../api/api-paths';
import { SessionService } from '../auth/session.service';
import { STORAGE_KEYS } from '../constants/storage-keys';

export interface CartProduct {
  productId: number;
  productName: string;
  price: number;
  imageUrl?: string;
  available?: boolean;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface PersistedCartItem { productId: number; quantity: number; }
interface PersistedCartResponse { items: PersistedCartItem[]; valid: boolean; message: string; }
interface InventoryCartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  imageUrl?: string;
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  readonly items = signal<CartItem[]>(this.readCart());
  readonly itemCount = computed(() => this.items().reduce((total, item) => total + item.quantity, 0));
  readonly total = computed(() => this.items().reduce((total, item) => total + item.price * item.quantity, 0));
  readonly syncing = signal(false);
  readonly syncError = signal('');

  /**
   * `loadPersistedCart()` (layout mount) and `mergeLocalToAccount()` (just after
   * login) can both fire within the same login-navigation window. Each
   * independently re-fetches the catalog and overwrites `items`/localStorage, so
   * running them concurrently is a real lost-update race (ENH-026) — queue them
   * through `concatMap` so the second always runs strictly after the first
   * finishes, instead of racing it.
   */
  private readonly restoreOps = new Subject<() => Observable<PersistedCartResponse | null>>();

  /**
   * Rapid quantity changes each fire their own unawaited `PUT /cart`
   * (ENH-026) — without sequencing, network reordering can let an older
   * snapshot's request land after a newer one and revert the persisted
   * cart. `switchMap` cancels the previous in-flight PUT whenever a new
   * one is queued, so only the latest mutation's request can ever complete.
   */
  private readonly persistQueue = new Subject<CartItem[]>();

  constructor() {
    this.restoreOps.pipe(concatMap((op) => op())).subscribe();
    this.persistQueue.pipe(
      switchMap((items) => this.http.put<PersistedCartResponse>(API_PATHS.cart.root, {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      }).pipe(catchError(() => of(null)))),
    ).subscribe();
  }

  loadPersistedCart(): void {
    if (!this.session.isAuthenticated()) return;
    this.syncing.set(true);
    this.syncError.set('');
    this.restoreOps.next(() => this.http.get<PersistedCartResponse>(API_PATHS.cart.root).pipe(
      catchError(() => {
        this.syncError.set('Saved cart is unavailable; using this browser cart.');
        return of(null);
      }),
      switchMap((cart) => {
        if (cart) this.restorePersistedItems(cart.items);
        this.syncing.set(false);
        return of(cart);
      }),
    ));
  }

  mergeLocalToAccount(): void {
    if (!this.session.isAuthenticated() || !this.items().length) return;
    this.syncing.set(true);
    this.restoreOps.next(() => this.http.post<PersistedCartResponse>(API_PATHS.cart.merge, this.toPersistedRequest()).pipe(
      catchError(() => {
        this.syncError.set('Could not sync cart to your account yet.');
        return of(null);
      }),
      switchMap((cart) => {
        if (cart) this.restorePersistedItems(cart.items);
        this.syncing.set(false);
        return of(cart);
      }),
    ));
  }

  validatePersistedCart() {
    return this.http.post<PersistedCartResponse>(API_PATHS.cart.validate, {});
  }

  add(product: CartProduct): void {
    this.update((items) => {
      const existing = items.find((item) => item.productId === product.productId);
      return existing
        ? items.map((item) => item.productId === product.productId ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { ...product, quantity: 1 }];
    });
  }

  setQuantity(productId: number, quantity: number): void {
    this.update((items) => quantity < 1
      ? items.filter((item) => item.productId !== productId)
      : items.map((item) => item.productId === productId ? { ...item, quantity } : item));
  }

  remove(productId: number): void { this.setQuantity(productId, 0); }

  clear(): void { this.update(() => []); }

  private update(transform: (items: CartItem[]) => CartItem[]): void {
    const next = transform(this.items());
    this.items.set(next);
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(next));
    this.persistQuantities(next);
  }

  private persistQuantities(items: CartItem[]): void {
    if (!this.session.isAuthenticated()) return;
    this.persistQueue.next(items);
  }

  private restorePersistedItems(persistedItems: PersistedCartItem[]): void {
    this.http.get<InventoryCartItem[]>(API_PATHS.inventory.publicItems).pipe(catchError(() => of([]))).subscribe((catalog) => {
      const catalogById = new Map(catalog.map((item) => [item.productId, item]));
      const localById = new Map(this.items().map((item) => [item.productId, item]));
      const next = persistedItems.map((item) => {
        const product = catalogById.get(item.productId);
        return {
          ...(localById.get(item.productId) ?? {
            productId: item.productId,
            productName: product?.productName ?? `Product ${item.productId}`,
            price: product?.unitPrice ?? 0,
            imageUrl: product?.imageUrl,
            available: product?.available ?? true,
          }),
          quantity: item.quantity,
        };
      });
      this.items.set(next);
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(next));
    });
  }

  private toPersistedRequest(): { items: PersistedCartItem[] } {
    return { items: this.items().map((item) => ({ productId: item.productId, quantity: item.quantity })) };
  }

  private readCart(): CartItem[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter(this.isCartItem) : [];
    } catch { return []; }
  }

  private isCartItem(value: unknown): value is CartItem {
    return typeof value === 'object' && value !== null
      && typeof (value as CartItem).productId === 'number'
      && typeof (value as CartItem).productName === 'string'
      && typeof (value as CartItem).price === 'number'
      && typeof (value as CartItem).quantity === 'number';
  }
}
