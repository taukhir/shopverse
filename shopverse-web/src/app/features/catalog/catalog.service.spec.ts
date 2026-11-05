import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CatalogService } from './catalog.service';

const inventoryItem = {
  productId: 1,
  productName: 'Widget',
  unitPrice: 100,
  available: true,
  imageUrl: '/img/1.png',
  imageKey: 'k1',
  category: 'Tools',
  brand: 'Acme',
};

describe('CatalogService', () => {
  let service: CatalogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CatalogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it('maps inventory items into catalog items', () => {
    let result: unknown;
    service.getCatalog().subscribe((items) => (result = items));
    httpMock.expectOne('/api/v1/inventory/public/items').flush([inventoryItem]);

    expect(result).toEqual([
      {
        productId: 1,
        productName: 'Widget',
        price: 100,
        available: true,
        imageUrl: '/img/1.png',
        imageKey: 'k1',
        category: 'Tools',
        brand: 'Acme',
        model: undefined,
        description: undefined,
      },
    ]);
  });

  it('caches the catalog and does not re-request within the TTL', () => {
    service.getCatalog().subscribe();
    httpMock.expectOne('/api/v1/inventory/public/items').flush([inventoryItem]);

    service.getCatalog().subscribe();
    httpMock.expectNone('/api/v1/inventory/public/items');
  });

  it('bypasses the cache when refresh is requested', () => {
    service.getCatalog().subscribe();
    httpMock.expectOne('/api/v1/inventory/public/items').flush([inventoryItem]);

    service.getCatalog({ refresh: true }).subscribe();
    httpMock.expectOne('/api/v1/inventory/public/items').flush([inventoryItem]);
  });

  it('falls back to the order-service catalog endpoint when inventory fails', () => {
    let result: unknown;
    service.getCatalog().subscribe((items) => (result = items));
    httpMock.expectOne('/api/v1/inventory/public/items').error(new ProgressEvent('error'));
    httpMock.expectOne('/api/v1/orders/public/catalog').flush([{ productId: 2, productName: 'Fallback', price: 5, available: true, imageUrl: '', imageKey: '' }]);

    expect(result).toEqual([{ productId: 2, productName: 'Fallback', price: 5, available: true, imageUrl: '', imageKey: '' }]);
  });

  it('getCategories() falls back to an empty list on failure', () => {
    let result: unknown;
    service.getCategories().subscribe((categories) => (result = categories));
    httpMock.expectOne('/api/v1/inventory/public/categories').error(new ProgressEvent('error'));
    expect(result).toEqual([]);
  });

  it('getProductById() returns the product and up to 3 related items from inventory', () => {
    let result: { product: unknown; related: unknown[] } | undefined;
    service.getProductById(1).subscribe((value) => (result = value));

    httpMock.expectOne('/api/v1/inventory/public/items/1').flush(inventoryItem);
    httpMock.expectOne('/api/v1/inventory/public/items/1/related').flush([
      { ...inventoryItem, productId: 2 },
      { ...inventoryItem, productId: 3 },
      { ...inventoryItem, productId: 4 },
      { ...inventoryItem, productId: 5 },
    ]);

    expect((result?.product as { productId: number }).productId).toBe(1);
    expect(result?.related).toHaveLength(3);
  });

  it('getProductById() falls back to catalog-based lookup with category/brand scoring when inventory has no direct match', () => {
    let result: { product: unknown; related: unknown[] } | undefined;
    service.getProductById(1).subscribe((value) => (result = value));

    httpMock.expectOne('/api/v1/inventory/public/items/1').flush(null as never);
    httpMock.expectOne('/api/v1/inventory/public/items/1/related').flush([]);
    httpMock.expectOne('/api/v1/inventory/public/items').flush([
      inventoryItem,
      { ...inventoryItem, productId: 6, category: 'Tools', brand: 'Other' },
      { ...inventoryItem, productId: 7, category: 'Other', brand: 'Acme' },
    ]);

    expect((result?.product as { productId: number }).productId).toBe(1);
    expect((result?.related as Array<{ productId: number }>).map((item) => item.productId)).toEqual([6, 7]);
  });
});
