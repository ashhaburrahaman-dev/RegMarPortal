/**
 * Shared TypeScript types for the client.
 * Re-exports schema-inferred types and adds API response types.
 */

export type { Person, PersonRole, MarriageCreate, MarriageUpdate, LoginInput } from '@regmar/shared'

// ─── API Response types ───────────────────────────────────────────────────────

export interface ApiUser {
  id: string
  fullName: string
  username: string
  role: 'ADMIN' | 'OPERATOR'
  lastLogin: number | null
}

export interface PersonRecord {
  id: string
  marriageId: string
  role: 'GROOM' | 'BRIDE' | 'WAKIL' | 'WITNESS1' | 'WITNESS2'
  fullName: string
  fatherName: string | null
  pincode: string | null
  postOffice: string | null
  stateName: string | null
  districtName: string | null
  policeStation: string | null
  villageCity: string | null
}

export interface MarriageRecord {
  id: string
  regBookNo: string
  pageNo: string
  regYear: number
  memoNumber: string
  marriageDate: string
  registrationDate: string
  dowerAmount: number
  paymentMethod: 'CASH' | 'DEFERRED'
  deferredAmount: number
  promptAmount: number
  createdBy: string | null
  createdAt: number | null
  updatedAt: number | null
  // Joined fields (from list queries)
  groomName?: string
  brideName?: string
}

export interface MarriageWithPersons extends MarriageRecord {
  persons: PersonRecord[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface PincodeResult {
  postOffices: Array<{ name: string; branchType: string }>
  district: string
  state: string
}

export interface DashboardStats {
  totalCertificates: number
  todayRegistrations: number
  thisYearRegistrations: number
  activeUsers: number
}
