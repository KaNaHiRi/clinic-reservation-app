export interface Reservation {
  id: string
  patientName: string
  phone?: string | null
  status: 'reserved' | 'visited' | 'cancelled'
  reservedAt: string
  memo?: string | null
  staffId?: string | null
  departmentId?: string | null
  staff?: { id: string; name: string } | null
  department?: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface Staff {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface Department {
  id: string
  name: string
  isActive: boolean
}

export type ReservationStatus = 'reserved' | 'visited' | 'cancelled'

export type ReservationFormData = {
  patientName: string
  phone: string
  status: ReservationStatus
  reservedAt: string
  memo: string
  staffId: string | null
  departmentId: string | null
}