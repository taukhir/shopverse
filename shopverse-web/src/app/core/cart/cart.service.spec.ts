import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { STORAGE_KEYS } from '../constants/storage-keys';
import { CartService } from './cart.service';
import { SessionService } from '../auth/session.service';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let sessionStub: { isAuthenticated: () => boolean };

  function configure(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionService, useValue: sessionStub },
      ],
    });
    service = TestBed.inject(CartService);
    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStub = { isAuthenticated: () => false };
    configure();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts empty when localStorage has no saved cart', () => {
    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
    expect(service.total()).toBe(0);
  });

  it('ignores malformed localStorage content and starts empty', () => {
    localStorage.setItem(STORAGE_KEYS.cart, 'not-json');
    TestBed.resetTestingModule();
    configure();
    expect(service.items()).toEqual([]);
  });

  it('adds a new product with quantity 1', () => {
    service.add({ productId: 1, productName: 'Widget', price: 100 });
    expect(service.items()).toEqual([{ productId: 1, productName: 'Widget', price: 100, quantity: 1 }]);
    expect(service.itemCount()).toBe(1);
    expect(service.total()).toBe(100);
  });

  it('increments quantity when the same product is added again', () => {
    const product = { productId: 1, productName: 'Widget', price: 100 };
    service.add(product);
    service.add(product);
    expect(service.items()[0].quantity).toBe(2);
    expect(service.itemCount()).toBe(2);
    expect(service.total()).toBe(200);
  });

  it('persists cart items to localStorage on every mutation', () => {
    service.add({ productId: 2, productName: 'Gadget', price: 50 });
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ productId: 2, quantity: 1 });
  });

  it('removes an item when setQuantity is called with a value below 1', () => {
    service.add({ productId: 3, productName: 'Thing', price: 10 });
    service.setQuantity(3, 0);
    expect(service.items()).toEqual([]);
  });

  it('remove() deletes the matching item', () => {
    service.add({ productId: 4, productName: 'Thing', price: 10 });
    service.remove(4);
    expect(service.items()).toEqual([]);
  });

  it('clear() empties the cart', () => {
    service.add({ productId: 5, productName: 'Thing', price: 10 });
    service.clear();
    expect(service.items()).toEqual([]);
    expect(service.itemCount()).toBe(0);
  });

  it('does not call the backend when the user is unauthenticated', () => {
    service.add({ productId: 6, productName: 'Thing', price: 10 });
    httpMock.expectNone(() => true);
  });

  it('persists quantities to the backend cart when authenticated', () => {
    sessionStub.isAuthenticated = () => true;
    service.add({ productId: 7, productName: 'Thing', price: 10 });
    const request = httpMock.expectOne((req) => req.method === 'PUT' && req.url === '/api/v1/cart');
    expect(request.request.body.items).toEqual([{ productId: 7, quantity: 1 }]);
    request.flush({ items: [], valid: true, message: '' });
  });

  it('loadPersistedCart does nothing when unauthenticated', () => {
    service.loadPersistedCart();
    httpMock.expectNone(() => true);
    expect(service.syncing()).toBe(false);
  });

  it('loadPersistedCart merges the server cart with catalog data', () => {
    sessionStub.isAuthenticated = () => true;
    service.loadPersistedCart();
    expect(service.syncing()).toBe(true);

    httpMock.expectOne('/api/v1/cart').flush({
      items: [{ productId: 8, quantity: 2 }],
      valid: true,
      message: '',
    });
    httpMock.expectOne('/api/v1/inventory/public/items').flush([
      { productId: 8, productName: 'Server Thing', unitPrice: 20, available: true, imageUrl: '', imageKey: '' },
    ]);

    expect(service.items()).toEqual([
      { productId: 8, productName: 'Server Thing', price: 20, imageUrl: '', available: true, quantity: 2 },
    ]);
    expect(service.syncing()).toBe(false);
  });

  it('loadPersistedCart records a sync error when the request fails', () => {
    sessionStub.isAuthenticated = () => true;
    service.loadPersistedCart();
    httpMock.expectOne('/api/v1/cart').error(new ProgressEvent('error'));
    expect(service.syncError()).toContain('Saved cart is unavailable');
    expect(service.syncing()).toBe(false);
  });

  it('mergeLocalToAccount does nothing when the cart is empty', () => {
    sessionStub.isAuthenticated = () => true;
    service.mergeLocalToAccount();
    httpMock.expectNone(() => true);
  });

  it('mergeLocalToAccount posts local items and restores the merged response', () => {
    sessionStub.isAuthenticated = () => true;
    service.add({ productId: 9, productName: 'Local Thing', price: 30 });
    // draining the PUT from add() before exercising merge
    httpMock.expectOne((req) => req.method === 'PUT').flush({ items: [], valid: true, message: '' });

    service.mergeLocalToAccount();
    const mergeRequest = httpMock.expectOne((req) => req.method === 'POST' && req.url === '/api/v1/cart/merge');
    mergeRequest.flush({ items: [{ productId: 9, quantity: 3 }], valid: true, message: '' });
    httpMock.expectOne('/api/v1/inventory/public/items').flush([]);

    expect(service.items()[0]).toMatchObject({ productId: 9, quantity: 3, productName: 'Local Thing' });
  });
});
