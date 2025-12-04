export const POSITIONS = [
  "Master Technician (A-Tech)", "B-Tech", "C-Tech", "Lube Technician",
  "Transmission Technician", "GS Technician", "Tire Technician",
  "Service Advisor", "Service Writer (Junior Advisor)", "Service Manager",
  "General Manager", "Customer Service Agent", "Parts Manager",
  "Parts Runner", "Shop Foreman / Lead Tech", "Shop Porter",
  "Bookkeeper", "Marketing Coordinator", "Other"
];

export const TECH_POSITIONS = [
  "Master Technician (A-Tech)", "B-Tech", "C-Tech", "Lube Technician",
  "Transmission Technician", "GS Technician", "Tire Technician",
  "Shop Foreman / Lead Tech"
];

export const ADVISOR_POSITIONS = [
  "Service Advisor", "Service Writer (Junior Advisor)", "Service Manager",
  "General Manager", "Customer Service Agent"
];

export const STATUSES = [
  "NEW", "CONTACTED", "PHONE_SCREEN", "IN_PERSON_1", "IN_PERSON_2",
  "TECH_TEST", "OFFER_SENT", "OFFER_ACCEPTED", "HIRED", "REJECTED"
] as const;

export type Status = typeof STATUSES[number];

export const SOURCES = [
  "Website", "Google", "Indeed", "Facebook", "TikTok",
  "Referral", "Walk-in", "ZipRecruiter", "Returning Applicant", "Other"
];

export const ASE_CERTS = [
  "A1 Engine Repair", "A2 Automatic Trans/Transaxle", "A3 Manual Drive Train & Axles",
  "A4 Suspension & Steering", "A5 Brakes", "A6 Electrical/Electronic Systems",
  "A7 Heating & Air Conditioning", "A8 Engine Performance",
  "L1 Advanced Engine Performance", "X1 Exhaust Systems",
  "G1 Auto Maintenance & Light Repair", "Other ASE"
];

export const SKILL_LEVELS = ["No experience", "Basic", "Intermediate", "Advanced"];
export const CONTACT_METHODS = ["Phone", "Text", "Email"];
export const TOOL_OPTIONS = ["Yes", "No", "Some"];

export interface Shop {
  id: string;
  name: string;
  slug: string;
}

export interface Applicant {
  id: string;
  created_at: string;
  updated_at: string;
  shop_id: string;
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  status: string;
  source: string | null;
  form_data: Record<string, any>;
  internal_data: Record<string, any>;
}

export interface ApplicantListItem {
  id: string;
  created_at: string;
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  status: string;
  source: string | null;
}
