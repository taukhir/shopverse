import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { ToastService } from '../../core/feedback/toast.service';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { formatInr } from '../../shared/utils/formatters';
import { CatalogItem, CatalogService } from './catalog.service';

type CatalogState = 'loading' | 'ready' | 'error';
type AvailabilityFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
type CatalogSort = 'featured' | 'priceAsc' | 'priceDesc' | 'name';

@Component({
  selector: 'app-catalog-page',
  imports: [EmptyStateComponent, FormsModule, ImageFallbackDirective, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './catalog-page.component.html',
  styleUrl: './catalog-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogPageComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  protected readonly state = signal<CatalogState>('loading');
  protected readonly products = signal<CatalogItem[]>([]);
  protected readonly search = signal('');
  protected readonly category = signal('ALL');
  protected readonly availability = signal<AvailabilityFilter>('ALL');
  protected readonly sort = signal<CatalogSort>('featured');
  protected readonly categories = computed(() => {
    const values = this.products().map((product) => product.category || this.categoryFrom(product)).filter(Boolean);
    return ['ALL', ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))];
  });
  protected readonly filteredProducts = computed(() => {
    const query = this.search().trim().toLowerCase();
    const category = this.category();
    const availability = this.availability();
    const products = this.products().filter((product) => {
      const productCategory = product.category || this.categoryFrom(product);
      const haystack = `${product.productName} ${productCategory} ${product.brand ?? ''} ${product.model ?? ''}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesCategory = category === 'ALL' || productCategory === category;
      const matchesAvailability = availability === 'ALL'
        || (availability === 'AVAILABLE' && product.available)
        || (availability === 'UNAVAILABLE' && !product.available);
      return matchesSearch && matchesCategory && matchesAvailability;
    });
    return [...products].sort((a, b) => {
      switch (this.sort()) {
        case 'priceAsc': return a.price - b.price;
        case 'priceDesc': return b.price - a.price;
        case 'name': return a.productName.localeCompare(b.productName);
        default: return Number(b.available) - Number(a.available) || a.productId - b.productId;
      }
    });
  });

  constructor() {
    this.loadCatalog();
  }

  protected loadCatalog(refresh = false): void {
    this.state.set('loading');
    this.catalogService.getCatalog({ refresh }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.state.set('ready');
      },
      error: () => {
        this.state.set('error');
        this.toast.error('Catalog is unavailable. Please try again.');
      },
    });
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected addToCart(product: CatalogItem): void {
    this.cart.add(product);
    this.toast.success(`${product.productName} added to cart.`);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.category.set('ALL');
    this.availability.set('ALL');
    this.sort.set('featured');
  }

  protected categoryFrom(product: CatalogItem): string {
    const name = product.productName.toLowerCase();
    if (name.includes('keyboard') || name.includes('monitor') || name.includes('dock') || name.includes('headphone')) return 'Tech';
    if (name.includes('home') || name.includes('lamp') || name.includes('desk')) return 'Home';
    return 'Everyday';
  }
}
