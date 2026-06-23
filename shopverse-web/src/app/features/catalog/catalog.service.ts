import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface CatalogItem {
  productId: number;
  productName: string;
  price: number;
  available: boolean;
  imageUrl: string;
  imageKey: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  getCatalog() {
    return this.http.get<CatalogItem[]>('/api/v1/orders/public/catalog');
  }
}
