import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImageFallbackDirective } from '../../shared/directives/image-fallback.directive';

@Component({
  selector: 'app-storefront',
  imports: [ImageFallbackDirective, RouterLink],
  templateUrl: './storefront.component.html',
  styleUrl: './storefront.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontComponent {
  protected readonly highlights = [
    { value: 'Live', label: 'Inventory-aware catalog', meta: 'Stock checked before checkout' },
    { value: 'Safe', label: 'Session-based checkout', meta: 'No anonymous order drift' },
    { value: 'Trace', label: 'Visible order progress', meta: 'Timeline after placement' },
  ];

  protected readonly flow = [
    { step: '01', title: 'Choose clearly', copy: 'Browse a focused catalog with live product images and availability.' },
    { step: '02', title: 'Keep context', copy: 'Open product details, adjust quantity, and keep your cart saved locally.' },
    { step: '03', title: 'Track progress', copy: 'Checkout starts the workflow and order history shows what happened next.' },
  ];

  protected readonly signals = [
    { label: 'Catalog', value: 'Online', tone: 'good' },
    { label: 'Cart', value: 'Saved locally', tone: 'active' },
    { label: 'Orders', value: 'Timeline ready', tone: 'active' },
    { label: 'Payments', value: 'Pluggable', tone: 'pending' },
  ];

  protected readonly intelligence = [
    { title: 'Availability-aware', copy: 'Products surface stock state before a customer reaches checkout.' },
    { title: 'Idempotent checkout', copy: 'Order placement uses a request key so retries behave like a real commerce system.' },
    { title: 'Operational visibility', copy: 'Customer and admin views expose order, payment, and recovery state.' },
  ];

  protected readonly categories = [
    { name: 'Home', description: 'Objects for quieter spaces.', mark: 'H', tone: 'cobalt' },
    { name: 'Tech', description: 'Tools that keep up.', mark: 'T', tone: 'lilac' },
    { name: 'Everyday', description: 'Small upgrades, well made.', mark: 'E', tone: 'ink' },
    { name: 'New arrivals', description: 'Freshly added to the edit.', mark: '+', tone: 'paper' },
  ];
}
