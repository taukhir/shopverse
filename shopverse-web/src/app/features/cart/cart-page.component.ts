import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { formatInr } from '../../shared/utils/formatters';

@Component({
  selector: 'app-cart-page',
  imports: [EmptyStateComponent, ImageFallbackDirective, RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent {
  protected readonly cart = inject(CartService);
  protected readonly hasUnavailableItems = computed(() => this.cart.items().some((item) => item.available === false));
  protected readonly canCheckout = computed(() => this.cart.items().length === 1 && !this.hasUnavailableItems());

  protected price(value: number): string {
    return formatInr(value);
  }

  protected lineMessage(available?: boolean): string {
    return available === false
      ? 'Unavailable items must be removed before checkout.'
      : 'Final stock is verified during checkout.';
  }

  protected removeUnavailableItems(): void {
    for (const item of this.cart.items()) {
      if (item.available === false) this.cart.remove(item.productId);
    }
  }
}
