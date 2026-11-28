import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_PATHS } from '../../core/api/api-paths';

export interface GroupRole { id: number; roleName: string; description: string | null; permissions: unknown[]; }
export interface AdminGroup { id: number; groupName: string; description: string | null; memberCount: number; roles: GroupRole[]; }
export interface GroupMember { id: number; username: string; email: string; firstName: string; lastName: string; status: string; }
export interface GroupPage<T> { content: T[]; totalElements: number; totalPages: number; }
export interface GroupApiResponse<T> { data: T; message: string; success: boolean; }
export interface GroupRequest { groupName: string; description: string; roleIds: number[]; }

@Injectable({ providedIn: 'root' })
export class AdminGroupsApiService {
  private readonly http = inject(HttpClient);

  list(search = '', page = 0, size = 12) { return this.http.get<GroupPage<AdminGroup>>(API_PATHS.groups.page(size, page, search)); }
  listRoles() { return this.http.get<GroupPage<GroupRole>>('/api/v1/roles?size=100&page=0'); }
  listMembers(groupId: number, page = 0, size = 10) { return this.http.get<GroupPage<GroupMember>>(API_PATHS.groups.members(groupId, page, size)); }
  create(request: GroupRequest) { return this.http.post<GroupApiResponse<AdminGroup>>(API_PATHS.groups.root, request); }
  update(id: number, request: GroupRequest) { return this.http.patch<GroupApiResponse<AdminGroup>>(API_PATHS.groups.byId(id), request); }
  delete(id: number) { return this.http.delete<void>(API_PATHS.groups.byId(id)); }
  addMember(groupId: number, userId: number) { return this.http.put<void>(API_PATHS.groups.member(groupId, userId), {}); }
  removeMember(groupId: number, userId: number) { return this.http.delete<void>(API_PATHS.groups.member(groupId, userId)); }
}
