import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-page-header',
  templateUrl: './admin-page-header.component.html',
  styleUrl: './admin-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageHeaderComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
}
