import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  protected readonly cart = inject(CartService);

  protected price(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  }
}
