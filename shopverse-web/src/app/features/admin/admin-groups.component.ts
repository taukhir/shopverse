import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { SessionService } from '../../core/auth/session.service';
import { ToastService } from '../../core/feedback/toast.service';
import { AdminGroupsApiService, AdminGroup, GroupMember, GroupRole, GroupRequest } from './admin-groups-api.service';

@Component({
  selector: 'app-admin-groups',
  imports: [AdminHeaderComponent, FormsModule, RouterLink],
  templateUrl: './admin-groups.component.html',
  styleUrl: './admin-groups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminGroupsComponent {
  private readonly api = inject(AdminGroupsApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);
  protected readonly groups = signal<AdminGroup[]>([]);
  protected readonly roles = signal<GroupRole[]>([]);
  protected readonly members = signal<GroupMember[]>([]);
  protected readonly selected = signal<AdminGroup | null>(null);
  protected readonly query = signal('');
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly editorOpen = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly memberId = signal<number | null>(null);
  protected draft: GroupRequest = this.emptyDraft();

  constructor() { this.load(); }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({ groups: this.api.list(this.query()), roles: this.api.listRoles() }).subscribe({
      next: ({ groups, roles }) => { this.groups.set(groups.content ?? []); this.roles.set(roles.content ?? []); this.loading.set(false); },
      error: () => { this.error.set('Groups could not be loaded. Check your access and try again.'); this.loading.set(false); },
    });
  }

  protected search(): void { this.load(); }
  protected select(group: AdminGroup): void {
    this.selected.set(group);
    this.members.set([]);
    this.api.listMembers(group.id).subscribe({ next: page => this.members.set(page.content ?? []), error: () => this.error.set('Group members could not be loaded.') });
  }
  protected create(): void { this.editingId.set(null); this.draft = this.emptyDraft(); this.editorOpen.set(true); }
  protected edit(group: AdminGroup): void {
    this.editingId.set(group.id);
    this.draft = { groupName: group.groupName, description: group.description ?? '', roleIds: (group.roles ?? []).map(role => role.id) };
    this.editorOpen.set(true);
  }
  protected save(): void {
    const request = { ...this.draft, groupName: this.draft.groupName.trim(), description: this.draft.description.trim() };
    if (!request.groupName) { this.error.set('Enter a group name.'); return; }
    this.saving.set(true);
    const id = this.editingId();
    (id ? this.api.update(id, request) : this.api.create(request)).subscribe({
      next: response => { this.toast.success(id ? 'Group updated.' : 'Group created.'); this.editorOpen.set(false); this.saving.set(false); this.load(); if (response.data) this.select(response.data); },
      error: () => { this.error.set('The group could not be saved. Review the details and try again.'); this.saving.set(false); },
    });
  }
  protected toggleRole(roleId: number, checked: boolean): void {
    const selected = new Set(this.draft.roleIds);
    checked ? selected.add(roleId) : selected.delete(roleId);
    this.draft.roleIds = [...selected];
  }
  protected hasRole(roleId: number): boolean { return this.draft.roleIds.includes(roleId); }
  protected async removeGroup(group: AdminGroup): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Delete group?', message: `Delete ${group.groupName} and its group assignments?`, confirmText: 'Delete group' });
    if (!ok) return;
    this.api.delete(group.id).subscribe({ next: () => { this.selected.set(null); this.toast.success('Group deleted.'); this.load(); }, error: () => this.error.set('The group could not be deleted.') });
  }
  protected addMember(): void {
    const group = this.selected(); const id = Number(this.memberId());
    if (!group || !Number.isInteger(id) || id < 1) { this.error.set('Enter a valid user ID to add a member.'); return; }
    this.api.addMember(group.id, id).subscribe({ next: () => { this.memberId.set(null); this.toast.success('Member added.'); this.select(group); this.load(); }, error: () => this.error.set('Member could not be added. Check the user ID and group membership.') });
  }
  protected async removeMember(member: GroupMember): Promise<void> {
    const group = this.selected(); if (!group) return;
    const ok = await this.confirm.confirm({ title: 'Remove group member?', message: `Remove ${member.username} from ${group.groupName}?`, confirmText: 'Remove member' });
    if (!ok) return;
    this.api.removeMember(group.id, member.id).subscribe({ next: () => { this.toast.success('Member removed.'); this.select(group); this.load(); }, error: () => this.error.set('Member could not be removed.') });
  }
  protected async logout(): Promise<void> {
    const ok = await this.confirm.confirm({ title: 'Sign out?', message: 'You will leave the operations workspace.', confirmText: 'Sign out' });
    if (!ok) return;
    this.session.logoutFromServer().subscribe({
      next: () => { this.toast.info('Signed out.'); this.router.navigateByUrl('/'); },
      error: () => this.toast.error('Sign out failed. Please check your connection and try again.'),
    });
  }
  private emptyDraft(): GroupRequest { return { groupName: '', description: '', roleIds: [] }; }
}
