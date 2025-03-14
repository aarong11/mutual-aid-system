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

export interface Location {
  lat: number;
  lng: number;
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
  submitted_at?: string;
  verified_at?: string;
}

export interface SubmissionFormData extends Omit<Submission, 'id' | 'status' | 'latitude' | 'longitude' | 'submitted_at' | 'verified_at'> {}