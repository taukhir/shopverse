import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-page',
  imports: [RouterLink, RouterLinkActive, TitleCasePipe, UpperCasePipe],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
})
export class AdminPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly section = this.route.snapshot.paramMap.get('section') ?? 'overview';
}
