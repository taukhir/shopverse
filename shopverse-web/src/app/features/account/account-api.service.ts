import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_PATHS } from '../../core/api/api-paths';

export interface UserAddress {
  id: number;
  label: string;
  recipientName: string;
  phoneNumber?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  defaultAddress: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UserAddressRequest = Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);

  listAddresses() {
    return this.http.get<UserAddress[]>(API_PATHS.users.addresses);
  }

  createAddress(address: UserAddressRequest) {
    return this.http.post<UserAddress>(API_PATHS.users.addresses, address);
  }

  updateAddress(id: number, address: UserAddressRequest) {
    return this.http.put<UserAddress>(API_PATHS.users.addressById(id), address);
  }

  deleteAddress(id: number) {
    return this.http.delete<void>(API_PATHS.users.addressById(id));
  }
}
