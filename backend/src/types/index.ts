export enum ResourceType {
  FOOD_BANK = 'food_bank',
  CLOTHING = 'clothing',
  SHELTER = 'shelter',
  MEDICAL = 'medical',
  OTHER = 'other'
}

export enum SubmissionStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum UserRole {
  CONTRIBUTOR = 'contributor',
  COORDINATOR = 'coordinator',
  ADMIN = 'admin'
}

export interface Submission {
  id?: number;
  address: string;
  zip_code: string;
  resource_type: ResourceType;
  description: string;
  contact_info?: string;
  latitude?: number;
  longitude?: number;
  status: SubmissionStatus;
  submitted_at?: Date;
  verified_at?: Date;
  submitted_by?: number;
}

export interface User {
  id?: number;
  username: string;
  password: string;
  role: UserRole;
  email: string;
}