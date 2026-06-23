import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
})
export class CustomerLayoutComponent {
  protected readonly cart = inject(CartService);
}
