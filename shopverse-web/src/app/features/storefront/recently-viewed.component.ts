import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecentlyViewedService } from '../../core/recently-viewed/recently-viewed.service';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { formatInr } from '../../shared/utils/formatters';
import { CatalogItem, CatalogService } from '../catalog/catalog.service';

@Component({
  selector: 'app-recently-viewed',
  imports: [ImageFallbackDirective, RouterLink],
  template: `
    @if (recent.count() > 0) {
      <section class="recent-section" aria-labelledby="recent-title">
        <div class="recent-heading">
          <div><p class="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2 id="recent-title">Recently viewed.</h2></div>
          <button type="button" (click)="clear()">Clear history</button>
        </div>
        @if (loading()) { <p class="recent-status" role="status">Loading your recent products…</p> }
        @else if (error()) { <p class="recent-status" role="alert">We could not load recent products. <button type="button" (click)="load()">Try again</button></p> }
        @else if (products().length) {
          <div class="recent-grid">
            @for (product of products(); track product.productId) {
              <a class="recent-card" [routerLink]="['/products', product.productId]">
                <span class="recent-image"><img [src]="product.imageUrl" [alt]="product.productName" width="240" height="170" loading="lazy" decoding="async" appImageFallback /></span>
                <span class="recent-info"><span>{{ product.available ? 'IN STOCK' : 'UNAVAILABLE' }}</span><strong>{{ product.productName }}</strong><b>{{ price(product.price) }}</b></span>
              </a>
            }
          </div>
        } @else {
          <p class="recent-status">These products are no longer in the catalog. Browse the collection for current items.</p>
        }
      </section>
    }
  `,
  styles: [`
    :host { display: block; }
    .recent-section { max-width: var(--max-width); margin: 0 auto; padding: 68px 24px; }
    .recent-heading { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 24px; }
    .eyebrow { margin: 0 0 10px; color: var(--muted); font-size: 10px; font-weight: 900; letter-spacing: .13em; }
    h2 { margin: 0; font-size: clamp(32px, 4vw, 52px); letter-spacing: -.065em; line-height: .95; }
    .recent-heading button { padding: 9px 12px; border: 1px solid var(--line); border-radius: 999px; color: var(--ink); background: transparent; font: inherit; font-size: 11px; font-weight: 800; cursor: pointer; }
    .recent-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; }
    .recent-card { min-width: 0; padding: 8px; border: 1px solid var(--line); border-radius: 16px; color: var(--ink); background: var(--white); text-decoration: none; transition: transform 160ms ease, box-shadow 160ms ease; }
    .recent-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(12,16,32,.08); }
    .recent-image { display: grid; aspect-ratio: 1.4; place-items: center; overflow: hidden; border-radius: 11px; background: #f1f1f8; }
    .recent-image img { width: 100%; height: 100%; object-fit: contain; }
    .recent-info { display: grid; gap: 7px; padding: 12px 4px 5px; }
    .recent-info span { color: #4d63d9; font-size: 8px; font-weight: 900; letter-spacing: .1em; }
    .recent-info strong { min-height: 34px; font-size: 12px; line-height: 1.3; }
    .recent-info b { font-size: 12px; }
    .recent-status { margin: 0; padding: 18px; border: 1px solid var(--line); border-radius: 12px; color: var(--muted); background: var(--white); font-size: 13px; }
    .recent-status button { margin-left: 8px; border: 0; color: #4354c8; background: transparent; font: inherit; font-weight: 800; cursor: pointer; }
    @media (max-width: 900px) { .recent-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
    @media (max-width: 540px) { .recent-section { padding: 48px 18px; }.recent-heading { align-items: start; flex-direction: column; }.recent-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentlyViewedComponent {
  protected readonly recent = inject(RecentlyViewedService);
  protected readonly products = signal<CatalogItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal(false);
  private readonly catalog = inject(CatalogService);

  constructor() {
    this.load();
  }

  protected clear(): void { this.recent.clear(); this.products.set([]); }
  protected price(value: number): string { return formatInr(value); }

  protected load(): void {
    const ids = this.recent.productIds();
    if (!ids.length) return;
    this.loading.set(true);
    this.error.set(false);
    this.catalog.getCatalog().subscribe({
      next: (catalog) => {
        const byId = new Map(catalog.map((product) => [product.productId, product]));
        const found = ids.map((id) => byId.get(id)).filter((product): product is CatalogItem => !!product);
        this.products.set(found);
        for (const id of ids) if (!byId.has(id)) this.recent.remove(id);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.error.set(true); },
    });
  }
}
