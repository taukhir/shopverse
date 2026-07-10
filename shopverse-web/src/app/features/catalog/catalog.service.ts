import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';

export interface CatalogItem {
  productId: number;
  productName: string;
  price: number;
  available: boolean;
  imageUrl: string;
  imageKey: string;
  category?: string;
  brand?: string;
  model?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private catalogCache$: Observable<CatalogItem[]> | null = null;
  private readonly cacheTtlMs = 60_000;
  private lastLoadedAt = 0;

  getCatalog(options: { refresh?: boolean } = {}) {
    const cacheIsFresh = Date.now() - this.lastLoadedAt < this.cacheTtlMs;
    if (!options.refresh && this.catalogCache$ && cacheIsFresh) {
      return this.catalogCache$;
    }

    this.catalogCache$ = this.http.get<CatalogItem[]>(API_PATHS.catalog.public).pipe(
      tap(() => {
        this.lastLoadedAt = Date.now();
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.catalogCache$;
  }

  getProductById(productId: number) {
    return this.getCatalog().pipe(
      map((products) => {
        const product = products.find((candidate) => candidate.productId === productId) ?? null;
        const related = product
          ? products
            .filter((candidate) => candidate.productId !== productId)
            .sort((a, b) => this.relatedScore(product, b) - this.relatedScore(product, a))
            .slice(0, 3)
          : [];
        return { product, related };
      }),
    );
  }

  private relatedScore(source: CatalogItem, candidate: CatalogItem): number {
    let score = 0;
    if (source.category && candidate.category === source.category) score += 4;
    if (source.brand && candidate.brand === source.brand) score += 2;
    if (candidate.available) score += 1;
    return score;
  }
}
