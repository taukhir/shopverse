import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { ComparisonService } from '../../core/comparison/comparison.service';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { CatalogItem, CatalogService } from './catalog.service';

@Component({
  selector: 'app-compare-page',
  imports: [EmptyStateComponent, ImageFallbackDirective, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './compare-page.component.html',
  styleUrl: './compare-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparePageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  protected readonly comparison = inject(ComparisonService);
  protected readonly products = signal<CatalogItem[]>([]);
  protected readonly state = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly rows = computed(() => {
    const items = this.products();
    return [
      { label: 'Price', values: items.map((item) => this.price(item.price)) },
      { label: 'Availability', values: items.map((item) => item.available ? 'In stock' : 'Currently unavailable') },
      { label: 'Category', values: items.map((item) => item.category || 'Not specified') },
      { label: 'Brand', values: items.map((item) => item.brand || 'Not specified') },
      { label: 'Model', values: items.map((item) => item.model || 'Not specified') },
      { label: 'Description', values: items.map((item) => item.description || 'No description available') },
    ];
  });

  constructor() {
    if (this.comparison.count() === 0) {
      this.state.set('ready');
      return;
    }
    this.load();
  }

  protected load(): void {
    if (this.comparison.count() === 0) {
      this.products.set([]);
      this.state.set('ready');
      return;
    }
    this.state.set('loading');
    this.catalog.getCatalog().subscribe({
      next: (items) => {
        const selected = new Set(this.comparison.productIds());
        const availableIds = new Set(items.map((item) => item.productId));
        this.products.set(items.filter((item) => selected.has(item.productId)));
        for (const productId of selected) {
          if (!availableIds.has(productId)) this.comparison.remove(productId);
        }
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected remove(product: CatalogItem): void {
    this.comparison.remove(product.productId);
    this.products.update((items) => items.filter((item) => item.productId !== product.productId));
  }

  protected clear(): void { this.comparison.clear(); this.products.set([]); }

  protected addToCart(product: CatalogItem): void {
    if (!product.available) return;
    this.cart.add(product);
    this.toast.success(`${product.productName} added to cart.`);
  }

  protected price(value: number): string { return formatInr(value); }
}
