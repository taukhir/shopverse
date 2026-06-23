import { Injectable, computed, signal } from '@angular/core';

export interface CartProduct {
  productId: number;
  productName: string;
  price: number;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

const storageKey = 'shopverse.cart.v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly items = signal<CartItem[]>(this.readCart());
  readonly itemCount = computed(() => this.items().reduce((total, item) => total + item.quantity, 0));
  readonly total = computed(() => this.items().reduce((total, item) => total + item.price * item.quantity, 0));

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

  private update(transform: (items: CartItem[]) => CartItem[]): void {
    const next = transform(this.items());
    this.items.set(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
  }

  private readCart(): CartItem[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
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
