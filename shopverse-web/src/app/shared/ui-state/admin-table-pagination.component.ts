import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-admin-table-pagination',
  standalone: true,
  template: `
    <nav class="admin-table-pagination" aria-label="Table pagination">
      <span aria-live="polite">{{ label() }}</span>
      <div>
        <button type="button" (click)="pageChange.emit(page() - 1)" [disabled]="page() <= 1" aria-label="Previous page">Previous</button>
        <span class="page-indicator" aria-current="page">Page {{ page() }} of {{ safePageCount() }}</span>
        <button type="button" (click)="pageChange.emit(page() + 1)" [disabled]="page() >= safePageCount()" aria-label="Next page">Next</button>
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }
    .admin-table-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--line, #dedee6); border-radius: 0 0 12px 12px; background: var(--white, #fff); }
    .admin-table-pagination > span { color: var(--muted, #686b7e); font-size: 12px; font-weight: 800; }
    .admin-table-pagination > div { display: flex; align-items: center; gap: 8px; }
    button { min-height: 38px; padding: 8px 12px; border: 1px solid var(--line, #dedee6); border-radius: 8px; color: var(--ink, #0c1020); background: transparent; font: inherit; font-size: 12px; font-weight: 800; }
    button:focus-visible { outline: 3px solid var(--accent, #4f61e9); outline-offset: 2px; }
    button:disabled { cursor: not-allowed; opacity: .45; }
    .page-indicator { min-width: 86px; color: var(--muted, #686b7e); font-size: 11px; text-align: center; }
    @media (max-width: 540px) { .admin-table-pagination { align-items: stretch; flex-direction: column; } .admin-table-pagination > div { justify-content: space-between; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTablePaginationComponent {
  readonly label = input.required<string>();
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageChange = output<number>();
  protected readonly safePageCount = computed(() => Math.max(1, this.pageCount()));
}
