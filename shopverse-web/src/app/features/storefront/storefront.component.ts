import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-storefront',
  imports: [RouterLink],
  templateUrl: './storefront.component.html',
  styleUrl: './storefront.component.scss',
})
export class StorefrontComponent {
  protected readonly categories = [
    { name: 'Home', description: 'Objects for quieter spaces.', mark: 'H', tone: 'cobalt' },
    { name: 'Tech', description: 'Tools that keep up.', mark: 'T', tone: 'lilac' },
    { name: 'Everyday', description: 'Small upgrades, well made.', mark: 'E', tone: 'ink' },
    { name: 'New arrivals', description: 'Freshly added to the edit.', mark: '+', tone: 'paper' },
  ];
}
