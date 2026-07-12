import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';

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

interface InventoryItem {
  productId: number;
  productName: string;
  unitPrice: number;
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

    this.catalogCache$ = this.http.get<InventoryItem[]>(API_PATHS.inventory.publicItems).pipe(
      map((items) => items.map((item) => this.fromInventory(item))),
      catchError(() => this.http.get<CatalogItem[]>(API_PATHS.catalog.public)),
      tap(() => {
        this.lastLoadedAt = Date.now();
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.catalogCache$;
  }

  getProductById(productId: number) {
    return forkJoin({
      product: this.http.get<InventoryItem>(API_PATHS.inventory.publicItem(productId)).pipe(
        map((item) => this.fromInventory(item)),
        catchError(() => of(null)),
      ),
      related: this.http.get<InventoryItem[]>(API_PATHS.inventory.publicRelated(productId)).pipe(
        map((items) => items.map((item) => this.fromInventory(item)).slice(0, 3)),
        catchError(() => of([] as CatalogItem[])),
      ),
    }).pipe(
      switchMap((result) => {
        if (result.product) return of(result);
        return this.getProductByIdFromCatalog(productId);
      }),
      catchError(() => this.getProductByIdFromCatalog(productId)),
    );
  }

  getCategories() {
    return this.http.get<string[]>(API_PATHS.inventory.publicCategories).pipe(catchError(() => of([])));
  }

  private relatedScore(source: CatalogItem, candidate: CatalogItem): number {
    let score = 0;
    if (source.category && candidate.category === source.category) score += 4;
    if (source.brand && candidate.brand === source.brand) score += 2;
    if (candidate.available) score += 1;
    return score;
  }

  private getProductByIdFromCatalog(productId: number) {
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

  private fromInventory(item: InventoryItem): CatalogItem {
    return {
      productId: item.productId,
      productName: item.productName,
      price: item.unitPrice,
      available: item.available,
      imageUrl: item.imageUrl,
      imageKey: item.imageKey,
      category: item.category,
      brand: item.brand,
      model: item.model,
      description: item.description,
    };
  }
}
