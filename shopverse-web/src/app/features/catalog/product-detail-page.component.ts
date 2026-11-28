import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { ToastService } from '../../core/feedback/toast.service';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { ComparisonService } from '../../core/comparison/comparison.service';
import { RecentlyViewedService } from '../../core/recently-viewed/recently-viewed.service';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { CatalogItem, CatalogService } from './catalog.service';

type ProductState = 'loading' | 'ready' | 'not-found' | 'error';

@Component({
  selector: 'app-product-detail-page',
  imports: [EmptyStateComponent, ImageFallbackDirective, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './product-detail-page.component.html',
  styleUrl: './product-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPageComponent {
  private readonly cart = inject(CartService);
  private readonly catalog = inject(CatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly wishlist = inject(WishlistService);
  protected readonly comparison = inject(ComparisonService);
  private readonly recentlyViewed = inject(RecentlyViewedService);

  protected readonly state = signal<ProductState>('loading');
  protected readonly product = signal<CatalogItem | null>(null);
  protected readonly related = signal<CatalogItem[]>([]);
  protected readonly quantity = signal(1);
  protected readonly total = computed(() => this.price((this.product()?.price ?? 0) * this.quantity()));
  protected readonly deliveryWindow = computed(() => this.product()?.available ? '2-4 business days' : 'Unavailable');
  private detailRequest?: Subscription;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  protected load(): void {
    this.detailRequest?.unsubscribe();
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(productId)) {
      this.state.set('not-found');
      return;
    }

    this.state.set('loading');
    this.detailRequest = this.catalog.getProductById(productId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ product, related }) => {
        this.product.set(product);
        this.related.set(related);
        if (product) this.recentlyViewed.record(product.productId);
        this.quantity.set(1);
        this.state.set(product ? 'ready' : 'not-found');
      },
      error: () => {
        this.state.set('error');
        this.toast.error('Product details are unavailable. Please try again.');
      },
    });
  }

  protected setQuantity(quantity: number): void {
    this.quantity.set(Math.max(1, Math.min(9, quantity)));
  }

  protected addToCart(product: CatalogItem): void {
    for (let count = 0; count < this.quantity(); count += 1) {
      this.cart.add(product);
    }
    this.toast.success(`${this.quantity()} × ${product.productName} added to cart.`);
  }

  protected toggleSaved(product: CatalogItem): void {
    const saved = this.wishlist.toggle(product.productId);
    this.toast.info(saved ? `${product.productName} saved for later.` : `${product.productName} removed from saved items.`);
  }

  protected toggleCompare(product: CatalogItem): void {
    const result = this.comparison.toggle(product.productId);
    if (result === 'limit') this.toast.info(`Compare up to ${this.comparison.limit} products at a time.`);
    else this.toast.info(result === 'added' ? `${product.productName} added to comparison.` : `${product.productName} removed from comparison.`);
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected productSpecs(product: CatalogItem): Array<{ label: string; value: string }> {
    return [
      { label: 'SKU', value: `SV-${product.productId}` },
      { label: 'Catalog status', value: product.available ? 'Available for checkout' : 'Temporarily unavailable' },
      { label: 'Delivery', value: product.available ? this.deliveryWindow() : 'Paused until restocked' },
      { label: 'Returns', value: '7-day replacement window' },
    ];
  }
}
