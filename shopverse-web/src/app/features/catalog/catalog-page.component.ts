import { Component, inject, signal } from '@angular/core';

import { CartService } from '../../core/cart/cart.service';
import { CatalogItem, CatalogService } from './catalog.service';

type CatalogState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-catalog-page',
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
})
export class CatalogPageComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly cart = inject(CartService);

  protected readonly state = signal<CatalogState>('loading');
  protected readonly products = signal<CatalogItem[]>([]);

  constructor() {
    this.loadCatalog();
  }

  protected loadCatalog(): void {
    this.state.set('loading');
    this.catalogService.getCatalog().subscribe({
      next: (products) => {
        this.products.set(products);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected price(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }

  protected addToCart(product: CatalogItem): void {
    this.cart.add(product);
  }
}
