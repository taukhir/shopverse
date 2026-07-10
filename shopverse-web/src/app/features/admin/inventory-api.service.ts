import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_PATHS } from '../../core/api/api-paths';

export interface InventoryItem {
  productId: number;
  productName: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  imageUrl: string;
  imageKey: string;
  unitPrice: number;
  availableQuantity: number;
  reservedQuantity: number;
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  private readonly http = inject(HttpClient);

  listItems() {
    return this.http.get<InventoryItem[]>(API_PATHS.inventory.publicItems);
  }

  saveItem(item: InventoryItem) {
    return this.http.put<InventoryItem>(API_PATHS.inventory.adminItems, item);
  }

  uploadImage(productId: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<Pick<InventoryItem, 'imageUrl' | 'imageKey'>>(API_PATHS.inventory.itemImage(productId), body);
  }
}
