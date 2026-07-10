import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { APP_MESSAGES } from '../../core/errors/app-messages';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { compareNumber, compareText } from '../../shared/utils/collection';
import { FailedEvent, RecoveryApiService, RecoveryService } from './recovery-api.service';

type ServiceFilter = RecoveryService | 'All';
type ReplayFilter = 'All' | 'Open' | 'Replayed';

@Component({
  selector: 'app-recovery-admin',
  imports: [DatePipe, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './recovery-admin.component.html',
  styleUrl: './recovery-admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryAdminComponent {
  private readonly confirm = inject(ConfirmService);
  private readonly recoveryApi = inject(RecoveryApiService);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  private readonly toast = inject(ToastService);
  protected readonly events = signal<FailedEvent[]>([]);
  protected readonly filter = signal<ServiceFilter>('All');
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly actionError = signal('');
  protected readonly actionSuccess = signal('');
  protected readonly busyKey = signal('');
  protected readonly filters: ServiceFilter[] = ['All', 'Orders', 'Inventory', 'Payments'];
  protected readonly replayFilters: ReplayFilter[] = ['All', 'Open', 'Replayed'];
  protected readonly replayFilter = signal<ReplayFilter>('All');
  protected readonly search = signal('');
  protected readonly sort = signal<'failedDesc'|'failedAsc'|'retryDesc'|'replayDesc'|'service'>('failedDesc');

  protected readonly filteredEvents = computed(() => {
    const filter = this.filter();
    const replayFilter = this.replayFilter();
    const query = this.search().trim().toLowerCase();
    const events = this.events().filter((event) => {
      const matchesService = filter === 'All' || event.service === filter;
      const matchesReplay = replayFilter === 'All'
        || (replayFilter === 'Open' && !event.replayed)
        || (replayFilter === 'Replayed' && event.replayed);
      const haystack = `${event.service} ${event.sourceTopic} ${event.failureReason}`.toLowerCase();
      return matchesService && matchesReplay && (!query || haystack.includes(query));
    });
    return [...events].sort((a, b) => {
      switch (this.sort()) {
        case 'failedAsc': return (a.failedAt || '').localeCompare(b.failedAt || '');
        case 'retryDesc': return compareNumber(b.retryCount, a.retryCount);
        case 'replayDesc': return compareNumber(b.replayCount, a.replayCount);
        case 'service': return compareText(`${a.service} ${a.sourceTopic}`, `${b.service} ${b.sourceTopic}`);
        default: return (b.failedAt || '').localeCompare(a.failedAt || '');
      }
    });
  });

  protected readonly totals = computed(() => {
    const events = this.events();
    return {
      all: events.length,
      open: events.filter((event) => !event.replayed).length,
      replayed: events.filter((event) => event.replayed).length,
      orders: events.filter((event) => event.service === 'Orders').length,
      inventory: events.filter((event) => event.service === 'Inventory').length,
      payments: events.filter((event) => event.service === 'Payments').length,
    };
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.actionError.set('');
    this.actionSuccess.set('');
    this.recoveryApi.listEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(APP_MESSAGES.errors.recoveryUnavailable);
        this.loading.set(false);
      },
    });
  }

  protected setFilter(filter: ServiceFilter): void {
    this.filter.set(filter);
  }

  protected async replay(event: FailedEvent): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: `Replay ${event.service} event ${event.id}?`,
      message: 'Replay should only be used when the underlying issue has been resolved or the event is safe to retry.',
      confirmText: 'Replay event',
      tone: 'danger',
    });
    if (!confirmed) return;
    const key = this.eventKey(event);
    this.busyKey.set(key);
    this.actionError.set('');
    this.actionSuccess.set('');
    this.recoveryApi.replay(event).subscribe({
      next: (updated) => {
        this.events.update((events) => events.map((candidate) => this.eventKey(candidate) === key ? { ...updated, service: event.service } : candidate));
        this.actionSuccess.set(`${event.service} event ${event.id} replayed.`);
        this.busyKey.set('');
        this.toast.success(`${event.service} event ${event.id} replayed.`);
      },
      error: () => {
        this.actionError.set(`Could not replay ${event.service} event ${event.id}.`);
        this.busyKey.set('');
        this.toast.error(`Could not replay ${event.service} event ${event.id}.`);
      },
    });
  }

  protected eventKey(event: FailedEvent): string {
    return `${event.service}-${event.id}`;
  }

  protected logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/');
  }
}
