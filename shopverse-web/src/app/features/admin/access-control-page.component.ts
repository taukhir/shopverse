import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { SessionService } from '../../core/auth/session.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { EmptyStateComponent } from '../../shared/ui-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { AccessControlApiService, PermissionRecord, PermissionRequest, RoleRecord, RoleRequest } from './access-control-api.service';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';

const emptyRole = (): RoleRequest => ({ roleName: '', description: '', permissions: [] });
const emptyPermission = (): PermissionRequest => ({ permissionName: '', description: '', moduleName: '' });

@Component({
  selector: 'app-access-control-page',
  imports: [AdminHeaderComponent, EmptyStateComponent, FormsModule, LoadingSkeletonComponent, RouterLink],
  templateUrl: './access-control-page.component.html',
  styleUrl: './access-control-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessControlPageComponent {
  private readonly accessApi = inject(AccessControlApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);
  protected readonly roles = signal<RoleRecord[]>([]);
  protected readonly permissions = signal<PermissionRecord[]>([]);
  protected readonly selectedRoleId = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly savingRole = signal(false);
  protected readonly savingPermission = signal(false);
  protected readonly busyId = signal('');
  protected readonly error = signal('');
  protected readonly actionError = signal('');
  protected readonly roleEditorOpen = signal(false);
  protected readonly permissionEditorOpen = signal(false);
  protected readonly editingRoleId = signal<number | null>(null);
  protected readonly editingPermissionId = signal<number | null>(null);
  protected roleDraft = emptyRole();
  protected permissionDraft = emptyPermission();
  protected readonly selectedRole = computed(() => this.roles().find((role) => role.id === this.selectedRoleId()) ?? null);
  protected readonly permissionGroups = computed(() => {
    const groups = new Map<string, PermissionRecord[]>();
    for (const permission of this.permissions()) {
      const moduleName = permission.moduleName?.trim() || 'General';
      groups.set(moduleName, [...(groups.get(moduleName) ?? []), permission]);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ roles: this.accessApi.listRoles(), permissions: this.accessApi.listPermissions() }).subscribe({
      next: ({ roles, permissions }) => {
        this.roles.set(roles.content);
        this.permissions.set(permissions.content);
        if (!this.roles().some((role) => role.id === this.selectedRoleId())) {
          this.selectedRoleId.set(this.roles()[0]?.id ?? null);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Role and permission data could not be loaded. Check your access and try again.');
        this.loading.set(false);
      },
    });
  }

  protected selectRole(role: RoleRecord): void {
    this.selectedRoleId.set(role.id);
    this.closeRoleEditor();
  }

  protected createRole(): void {
    this.editingRoleId.set(null);
    this.roleDraft = emptyRole();
    this.actionError.set('');
    this.roleEditorOpen.set(true);
  }

  protected editRole(role: RoleRecord): void {
    this.selectedRoleId.set(role.id);
    this.editingRoleId.set(role.id);
    this.roleDraft = {
      roleName: role.roleName,
      description: role.description ?? '',
      permissions: role.permissions.map((permission) => permission.permissionName),
    };
    this.actionError.set('');
    this.roleEditorOpen.set(true);
  }

  protected togglePermission(permissionName: string): void {
    const permissions = new Set(this.roleDraft.permissions);
    if (permissions.has(permissionName)) permissions.delete(permissionName);
    else permissions.add(permissionName);
    this.roleDraft = { ...this.roleDraft, permissions: [...permissions] };
  }

  protected roleHasPermission(permissionName: string): boolean {
    return this.roleDraft.permissions.includes(permissionName);
  }

  protected saveRole(): void {
    if (this.savingRole()) return;
    this.savingRole.set(true);
    this.actionError.set('');
    const request: RoleRequest = {
      roleName: this.roleDraft.roleName.trim(),
      description: this.roleDraft.description.trim(),
      permissions: [...this.roleDraft.permissions],
    };
    const id = this.editingRoleId();
    const save$ = id === null ? this.accessApi.createRole(request) : this.accessApi.updateRole(id, request);
    save$.subscribe({
      next: (response) => {
        const saved = response.data;
        this.roles.update((roles) => id === null ? [...roles, saved].sort((a, b) => a.roleName.localeCompare(b.roleName)) : roles.map((role) => role.id === saved.id ? saved : role));
        this.selectedRoleId.set(saved.id);
        this.closeRoleEditor();
        this.savingRole.set(false);
        this.toast.success(id === null ? 'Role created.' : 'Role updated.');
      },
      error: () => {
        this.actionError.set('Role could not be saved. Check that its name is unique and each permission exists.');
        this.savingRole.set(false);
      },
    });
  }

  protected async deleteRole(role: RoleRecord): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: `Delete ${role.roleName}?`,
      message: 'A role assigned to a user cannot be deleted. This action is recorded in the admin audit log.',
      confirmText: 'Delete role',
      tone: 'danger',
    });
    if (!confirmed) return;
    const key = `role-${role.id}`;
    this.busyId.set(key);
    this.actionError.set('');
    this.accessApi.deleteRole(role.id).subscribe({
      next: () => {
        const remaining = this.roles().filter((item) => item.id !== role.id);
        this.roles.set(remaining);
        if (this.selectedRoleId() === role.id) this.selectedRoleId.set(remaining[0]?.id ?? null);
        this.busyId.set('');
        this.toast.success('Role deleted.');
      },
      error: () => {
        this.actionError.set('Role could not be deleted. It may still be assigned to one or more users.');
        this.busyId.set('');
      },
    });
  }

  protected createPermission(): void {
    this.editingPermissionId.set(null);
    this.permissionDraft = emptyPermission();
    this.actionError.set('');
    this.permissionEditorOpen.set(true);
  }

  protected editPermission(permission: PermissionRecord): void {
    this.editingPermissionId.set(permission.id);
    this.permissionDraft = {
      permissionName: permission.permissionName,
      description: permission.description ?? '',
      moduleName: permission.moduleName ?? '',
    };
    this.actionError.set('');
    this.permissionEditorOpen.set(true);
  }

  protected savePermission(): void {
    if (this.savingPermission()) return;
    this.savingPermission.set(true);
    this.actionError.set('');
    const request: PermissionRequest = {
      permissionName: this.permissionDraft.permissionName.trim(),
      description: this.permissionDraft.description.trim(),
      moduleName: this.permissionDraft.moduleName.trim(),
    };
    const id = this.editingPermissionId();
    const save$ = id === null ? this.accessApi.createPermission(request) : this.accessApi.updatePermission(id, request);
    save$.subscribe({
      next: (response) => {
        this.permissions.update((permissions) => id === null
          ? [...permissions, response.data].sort((a, b) => a.permissionName.localeCompare(b.permissionName))
          : permissions.map((permission) => permission.id === response.data.id ? response.data : permission));
        if (id !== null) {
          this.accessApi.listRoles().subscribe({ next: (roles) => this.roles.set(roles.content) });
        }
        this.permissionEditorOpen.set(false);
        this.savingPermission.set(false);
        this.toast.success(id === null ? 'Permission created.' : 'Permission updated.');
      },
      error: () => {
        this.actionError.set('Permission could not be saved. Check that its name is unique.');
        this.savingPermission.set(false);
      },
    });
  }

  protected async deletePermission(permission: PermissionRecord): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: `Delete ${permission.permissionName}?`,
      message: 'A permission assigned to a role cannot be deleted. This action is recorded in the admin audit log.',
      confirmText: 'Delete permission',
      tone: 'danger',
    });
    if (!confirmed) return;
    const key = `permission-${permission.id}`;
    this.busyId.set(key);
    this.actionError.set('');
    this.accessApi.deletePermission(permission.id).subscribe({
      next: () => {
        this.permissions.update((permissions) => permissions.filter((item) => item.id !== permission.id));
        this.busyId.set('');
        this.toast.success('Permission deleted.');
      },
      error: () => {
        this.actionError.set('Permission could not be deleted. It may still be assigned to one or more roles.');
        this.busyId.set('');
      },
    });
  }

  protected closeRoleEditor(): void {
    this.roleEditorOpen.set(false);
    this.editingRoleId.set(null);
    this.roleDraft = emptyRole();
  }

  protected logout(): void {
    this.session.logoutFromServer().subscribe({
      next: () => { this.toast.info('Signed out.'); this.router.navigateByUrl('/'); },
      error: () => this.toast.error('Sign out failed. Please check your connection and try again.'),
    });
  }
}
