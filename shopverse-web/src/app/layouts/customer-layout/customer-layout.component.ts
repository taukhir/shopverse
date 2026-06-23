import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
})
export class CustomerLayoutComponent {}
