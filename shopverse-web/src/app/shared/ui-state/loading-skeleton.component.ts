import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-skeleton',
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSkeletonComponent {
  readonly rows = input(3);
  readonly variant = input<'cards' | 'list'>('list');
  protected readonly placeholders = [1, 2, 3, 4, 5, 6];
}
