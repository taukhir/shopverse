import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { compareNumber, compareText } from '../../shared/utils/collection';
import { InventoryApiService, InventoryItem } from './inventory-api.service';

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
  imports: [EmptyStateComponent, FormsModule, ImageFallbackDirective, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './inventory-admin.component.html',
  styleUrl: './inventory-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryAdminComponent {
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  protected readonly items = signal<InventoryItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploadingImage = signal(false);
  protected readonly imageUploadError = signal('');
  protected readonly saveError = signal('');
  protected readonly search = signal('');
  protected readonly stockFilter = signal<'ALL'|'LOW'|'OUT'|'AVAILABLE'>('ALL');
  protected readonly sort = signal<'name'|'stockAsc'|'stockDesc'|'priceAsc'|'priceDesc'|'category'>('name');
  protected readonly page = signal(1);
  protected readonly pageSize = 8;
  protected form = blank();
  protected readonly filteredItems = computed(() => {
    const query = this.search().trim().toLowerCase();
    const stockFilter = this.stockFilter();
    const items = this.items().filter((item) => {
      const haystack = `${item.productName} ${item.category} ${item.brand} ${item.model}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesStock = stockFilter === 'ALL'
        || (stockFilter === 'LOW' && item.availableQuantity > 0 && item.availableQuantity < 5)
        || (stockFilter === 'OUT' && (item.availableQuantity === 0 || !item.available))
        || (stockFilter === 'AVAILABLE' && item.available && item.availableQuantity > 0);
      return matchesQuery && matchesStock;
    });
    return [...items].sort((a, b) => {
      switch (this.sort()) {
        case 'stockAsc': return compareNumber(a.availableQuantity, b.availableQuantity);
        case 'stockDesc': return compareNumber(b.availableQuantity, a.availableQuantity);
        case 'priceAsc': return compareNumber(a.unitPrice, b.unitPrice);
        case 'priceDesc': return compareNumber(b.unitPrice, a.unitPrice);
        case 'category': return compareText(`${a.category} ${a.productName}`, `${b.category} ${b.productName}`);
        default: return compareText(a.productName, b.productName);
      }
    });
  });
  protected readonly pageCount = computed(() => this.countPages(this.filteredItems().length));
  protected readonly stockSummary = computed(() => ({
    products: this.items().length,
    available: this.items().reduce((total, item) => total + item.availableQuantity, 0),
    reserved: this.items().reduce((total, item) => total + item.reservedQuantity, 0),
    low: this.items().filter((item) => item.availableQuantity > 0 && item.availableQuantity < 5).length,
    out: this.items().filter((item) => item.availableQuantity === 0).length,
  }));
  protected readonly visibleItems = computed(() => {
    const page = this.clampedPage(this.page(), this.pageCount());
    const start = (page - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.inventoryApi.listItems().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(APP_MESSAGES.errors.inventoryUnavailable);
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

  protected uploadImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.imageUploadError.set('');
    if (!file) return;
    if (this.form.productId <= 0) {
      this.imageUploadError.set('Enter a positive product ID before uploading an image.');
      input.value = '';
      return;
    }
    this.uploadingImage.set(true);
    this.inventoryApi.uploadImage(this.form.productId, file).subscribe({
      next: (image) => {
        this.form = { ...this.form, ...image };
        this.uploadingImage.set(false);
        this.toast.success('Product image uploaded. Save the item to apply it.');
        input.value = '';
      },
      error: () => {
        this.uploadingImage.set(false);
        this.imageUploadError.set('Image upload failed. Check the file type, size, and object storage connection.');
        input.value = '';
      },
    });
  }

  protected imagePreview(): string {
    return this.form.imageUrl?.trim() || '';
  }

  protected formWarnings(): string[] {
    const warnings: string[] = [];
    if (this.form.productId <= 0) warnings.push('Product ID should be a positive number.');
    if (this.form.unitPrice <= 0) warnings.push('Price must be greater than zero.');
    if (this.form.availableQuantity === 0) warnings.push('Item will be shown as unavailable unless stock is added.');
    if (!this.form.imageUrl?.startsWith('http') && !this.form.imageUrl?.startsWith('/')) {
      warnings.push('Image URL should be an absolute URL or a local asset path.');
    }
    return warnings;
  }

  protected deleteUnavailable(): void {
    this.toast.info('Delete is waiting for a backend inventory delete endpoint.');
  }

  protected pageLabel(): string {
    const total = this.filteredItems().length;
    if (!total) return '0 records';
    const page = this.clampedPage(this.page(), this.pageCount());
    const start = (page - 1) * this.pageSize + 1;
    const end = Math.min(start + this.pageSize - 1, total);
    return `${start}-${end} of ${total}`;
  }

  protected changePage(delta: number): void {
    this.page.set(this.clampedPage(this.page() + delta, this.pageCount()));
  }

  protected save(): void {
    this.saving.set(true);
    this.saveError.set('');
    this.inventoryApi.saveItem({ ...this.form }).subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.load();
        this.toast.success('Inventory item saved.');
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set(APP_MESSAGES.errors.inventorySaveFailed);
        this.toast.error('Inventory item could not be saved.');
      },
    });
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Sign out?',
      message: 'You will leave the operations workspace.',
      confirmText: 'Sign out',
    });
    if (!confirmed) return;
    this.session.logout();
    this.toast.info('Signed out.');
    this.router.navigateByUrl('/');
  }

  private countPages(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  private clampedPage(page: number, pageCount: number): number {
    return Math.min(Math.max(1, page), pageCount);
  }
}
