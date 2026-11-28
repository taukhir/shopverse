import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { ToastService } from '../../core/feedback/toast.service';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { CatalogItem, CatalogService } from './catalog.service';

type WishlistState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-wishlist-page',
  imports: [EmptyStateComponent, ImageFallbackDirective, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './wishlist-page.component.html',
  styleUrl: './wishlist-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPageComponent {
  private readonly catalog = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  protected readonly wishlist = inject(WishlistService);
  protected readonly state = signal<WishlistState>('loading');
  private readonly catalogItems = signal<CatalogItem[]>([]);
  protected readonly savedProducts = computed(() => {
    const savedIds = new Set(this.wishlist.savedIds());
    return this.catalogItems().filter((product) => savedIds.has(product.productId));
  });
  protected readonly missingCount = computed(() => Math.max(0, this.wishlist.count() - this.savedProducts().length));

  constructor() {
    if (this.wishlist.count() === 0) {
      this.state.set('ready');
      return;
    }
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.catalog.getCatalog().subscribe({
      next: (products) => {
        this.catalogItems.set(products);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }

  protected remove(product: CatalogItem): void {
    this.wishlist.remove(product.productId);
    this.toast.info(`${product.productName} removed from saved items.`);
  }

  protected addToCart(product: CatalogItem): void {
    this.cart.add(product);
    this.toast.success(`${product.productName} added to cart.`);
  }

  protected price(value: number): string {
    return formatInr(value);
  }
}
