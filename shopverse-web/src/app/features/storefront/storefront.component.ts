import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-storefront',
  imports: [RouterLink],
  templateUrl: './storefront.component.html',
  styleUrl: './storefront.component.scss',
})
export class StorefrontComponent {
  protected readonly categories = ['Home', 'Tech', 'Everyday', 'New arrivals'];
}
