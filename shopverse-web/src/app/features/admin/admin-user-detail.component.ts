import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { SessionService } from '../../core/auth/session.service';
import { formatInr } from '../../shared/utils/formatters';

interface User {
  id:number;
  username:string;
  email:string;
  firstName:string;
  lastName:string;
  phoneNumber:string|null;
  status:string;
  roles:Array<{roleName:string}>;
}

interface Role { id:number; roleName:string; description:string; }
interface Page<T> { content:T[]; totalElements:number; }
interface ApiResponse<T> { data:T; message:string; success:boolean; }
interface Order { id:number; orderNumber:string; customerUsername:string; status:string; totalAmount:number; createdAt:string; }

@Component({
  selector: 'app-admin-user-detail',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-user-detail.component.html',
  styleUrl: './admin-user-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly session = inject(SessionService);
  protected readonly user = signal<User | null>(null);
  protected readonly roles = signal<Role[]>([]);
  protected readonly userOrders = signal<Order[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly saveError = signal('');
  protected readonly saveSuccess = signal(false);
  protected readonly statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'];
  protected readonly form = { status: 'ACTIVE', roles: new Set<string>() };

  constructor() {
    this.load();
  }

  protected load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      user: this.http.get<ApiResponse<User>>(API_PATHS.users.byId(id ?? '')),
      roles: this.http.get<Page<Role>>(API_PATHS.roles.page(50)).pipe(catchError(() => of({ content: [], totalElements: 0 } as Page<Role>))),
      orders: this.http.get<Order[]>(API_PATHS.orders.adminAll).pipe(catchError(() => of([] as Order[]))),
    }).subscribe({
      next: ({ user, roles, orders }) => {
        this.user.set(user.data);
        this.roles.set(roles.content);
        this.populate(user.data);
        this.userOrders.set(orders.filter((order) => order.customerUsername === user.data.username));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('We could not load this user profile.');
        this.loading.set(false);
      },
    });
  }

  protected hasRole(roleName: string): boolean {
    return this.form.roles.has(roleName);
  }

  protected toggleRole(roleName: string): void {
    this.saveSuccess.set(false);
    if (this.form.roles.has(roleName)) this.form.roles.delete(roleName);
    else this.form.roles.add(roleName);
  }

  protected saveAccess(): void {
    const user = this.user();
    if (!user) return;
    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.http.patch<ApiResponse<User>>(API_PATHS.users.byId(user.id), {
      status: this.form.status,
      roles: Array.from(this.form.roles),
    }).subscribe({
      next: (response) => {
        this.user.set(response.data);
        this.populate(response.data);
        this.saveSuccess.set(true);
        this.saving.set(false);
      },
      error: () => {
        this.saveError.set('Access changes could not be saved. Confirm this admin has USER_UPDATE permission.');
        this.saving.set(false);
      },
    });
  }

  protected price(value: number): string {
    return formatInr(value);
  }

  protected logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/');
  }

  private populate(user: User): void {
    this.form.status = user.status;
    this.form.roles = new Set(user.roles.map((role) => role.roleName));
  }
}
