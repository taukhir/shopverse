import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface InventoryItem {
  productId:number;
  productName:string;
  brand:string;
  model:string;
  category:string;
  description:string;
  imageUrl:string;
  imageKey:string;
  unitPrice:number;
  availableQuantity:number;
  reservedQuantity:number;
  available:boolean;
}

const blank = (): InventoryItem => ({
  productId: 0,
  productName: '',
  brand: '',
  model: '',
  category: '',
  description: '',
  imageUrl: '',
  imageKey: '',
  unitPrice: 0,
  availableQuantity: 0,
  reservedQuantity: 0,
  available: false,
});

@Component({
  selector: 'app-inventory-admin',
  imports: [FormsModule],
  templateUrl: './inventory-admin.component.html',
  styleUrl: './inventory-admin.component.scss',
})
export class InventoryAdminComponent {
  private readonly http = inject(HttpClient);
  protected readonly items = signal<InventoryItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');
  protected form = blank();

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.http.get<InventoryItem[]>('/api/v1/inventory/public/items').subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Inventory is unavailable.');
        this.loading.set(false);
      },
    });
  }

  protected create(): void {
    this.form = blank();
    this.saveError.set('');
    this.editing.set(true);
  }

  protected edit(item: InventoryItem): void {
    this.form = { ...item };
    this.saveError.set('');
    this.editing.set(true);
  }

  protected close(): void {
    this.editing.set(false);
  }

  protected save(): void {
    this.saving.set(true);
    this.saveError.set('');
    this.http.put<InventoryItem>('/api/v1/inventory/admin/items', { ...this.form }).subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('The item could not be saved. Check required values and permissions.');
      },
    });
  }
}
