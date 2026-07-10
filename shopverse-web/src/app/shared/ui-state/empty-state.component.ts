import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly eyebrow = input('EMPTY');
  readonly title = input('Nothing to show.');
  readonly message = input('');
  readonly actionLabel = input('');
  readonly actionLink = input('');
}
