import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, of, switchMap } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';

export interface PermissionRecord {
  id: number;
  permissionName: string;
  description: string | null;
  moduleName: string | null;
}

export interface RoleRecord {
  id: number;
  roleName: string;
  description: string | null;
  permissions: PermissionRecord[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface RoleRequest {
  roleName: string;
  description: string;
  permissions: string[];
}

export interface PermissionRequest {
  permissionName: string;
  description: string;
  moduleName: string;
}

@Injectable({ providedIn: 'root' })
export class AccessControlApiService {
  private readonly http = inject(HttpClient);

  listRoles() {
    return this.listAllPages<RoleRecord>((page) => API_PATHS.roles.page(100, page));
  }

  listPermissions() {
    return this.listAllPages<PermissionRecord>((page) => API_PATHS.permissions.page(100, page));
  }

  createRole(request: RoleRequest) {
    return this.http.post<ApiResponse<RoleRecord>>(API_PATHS.roles.root, request);
  }

  updateRole(id: number, request: RoleRequest) {
    return this.http.patch<ApiResponse<RoleRecord>>(API_PATHS.roles.byId(id), request);
  }

  deleteRole(id: number) {
    return this.http.delete<void>(API_PATHS.roles.byId(id));
  }

  createPermission(request: PermissionRequest) {
    return this.http.post<ApiResponse<PermissionRecord>>(API_PATHS.permissions.root, request);
  }

  updatePermission(id: number, request: PermissionRequest) {
    return this.http.patch<ApiResponse<PermissionRecord>>(API_PATHS.permissions.byId(id), request);
  }

  deletePermission(id: number) {
    return this.http.delete<void>(API_PATHS.permissions.byId(id));
  }

  private listAllPages<T>(path: (page: number) => string) {
    return this.http.get<PageResponse<T>>(path(0)).pipe(
      switchMap((first) => {
        if (first.totalPages <= 1) return of(first.content);
        const remaining = Array.from({ length: first.totalPages - 1 }, (_, index) =>
          this.http.get<PageResponse<T>>(path(index + 1)),
        );
        return forkJoin(remaining).pipe(map((pages) => [...first.content, ...pages.flatMap((page) => page.content)]));
      }),
      map((content) => ({ content, totalElements: content.length, totalPages: 1 })),
    );
  }
}
