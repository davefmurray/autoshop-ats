// Status values
export const STATUSES = [
  'NEW',
  'CONTACTED',
  'PHONE_SCREEN',
  'IN_PERSON_1',
  'IN_PERSON_2',
  'OFFER_SENT',
  'HIRED',
  'REJECTED',
] as const;

export type Status = typeof STATUSES[number];

// Position values
export const POSITIONS = [
  'Technician',
  'GS',
  'Service Advisor',
  'Manager',
  'Tire Tech',
  'Lube Tech',
] as const;

export type Position = typeof POSITIONS[number];

// Source values
export const SOURCES = [
  'Website',
  'Indeed',
  'Referral',
  'Walk-in',
  'Other',
] as const;

// Applicant types
export interface Applicant {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  phone: string;
  email: string;
  position: string;
  experience_years: number;
  certifications: string[];
  expected_pay: string | null;
  source: string | null;
  resume_url: string | null;
  notes: string | null;
  status: Status;
}

export interface ApplicantListItem {
  id: string;
  created_at: string;
  name: string;
  position: string;
  status: Status;
  experience_years: number;
  source: string | null;
}

export interface ApplicantCreate {
  name: string;
  phone: string;
  email: string;
  position: string;
  experience_years: number;
  certifications: string[];
  expected_pay?: string;
  source?: string;
  resume_url?: string;
  notes?: string;
}

export interface ApplicantUpdate {
  name?: string;
  phone?: string;
  email?: string;
  position?: string;
  experience_years?: number;
  certifications?: string[];
  expected_pay?: string;
  source?: string;
  resume_url?: string;
  notes?: string;
  status?: Status;
}

// Note types
export interface Note {
  id: string;
  applicant_id: string;
  created_at: string;
  added_by: string | null;
  added_by_id: string | null;
  message: string;
}

export interface NoteCreate {
  message: string;
  added_by?: string;
}

// Auth types
export interface User {
  id: string;
  email: string;
}
