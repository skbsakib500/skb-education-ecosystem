// SKB Profile Foundation Types (matches migration 001)

export type ProfileVisibility = "public" | "members" | "institution" | "restricted";
export type AgeBracket = "minor_under_13" | "minor_13_17" | "adult" | null;
export type Sensitivity = "public" | "internal" | "sensitive" | "critical";

export interface ProfileFieldRegistry {
  field_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "jsonb" | "boolean" | "array" | "url" | "email" | "phone";
  sensitivity: Sensitivity;
  default_visibility: ProfileVisibility;
  owner_editable: boolean;
  institution_verified: boolean;
  never_public: boolean;
}

export interface ProfilePrivacySetting {
  id: string;
  user_id: string;
  field_key: string;
  visibility: ProfileVisibility;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  address: string | null;
  date_of_birth: string | null;
  blood_group: string | null;
  primary_role: string | null;
  sub_role: string | null;
  onboarding_complete: boolean | null;
  interests: string[] | null;
  preferences: Record<string, unknown> | null;
  phone_verified: boolean | null;
  username: string | null;
  headline: string | null;
  expertise: string[] | null;
  open_to: string[] | null;
  location: string | null;
  website: string | null;
  social_links: Record<string, string> | null;
  followers_count: number | null;
  following_count: number | null;
  // Migration 001 additions:
  profile_visibility: ProfileVisibility;
  role_specific: Record<string, unknown>;
  age_bracket: AgeBracket;
  privacy_version: number;
  created_at: string;
}

export type VerificationType = "identity" | "institution" | "credential" | "achievement";
export type VerificationStatus = "pending" | "verified" | "rejected" | "expired" | "revoked";

export interface VerificationRecord {
  id: string;
  subject_type: VerificationType;
  subject_id: string;
  verification_type: string;
  issuer_id: string | null;
  status: VerificationStatus;
  evidence_url: string | null;
  verified_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ConsentType = "terms" | "privacy" | "guardian" | "marketing" | "data_processing";

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  purpose: string | null;
  policy_version: string;
  status: "granted" | "withdrawn";
  granted_at: string;
  withdrawn_at: string | null;
  metadata: Record<string, unknown>;
}

export interface ProfileViewLogRow {
  id: number;
  viewer_id: string | null;
  target_id: string;
  view_type: "profile" | "portfolio" | "credential";
  viewed_at: string;
}

export interface PublicProfileResponse {
  id: string;
  full_name?: string;
  avatar_url?: string;
  headline?: string;
  bio?: string;
  username?: string;
  location?: string;
  website?: string;
  expertise?: string[];
  interests?: string[];
  open_to?: string[];
  social_links?: Record<string, string>;
  primary_role?: string;
  sub_role?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  blood_group?: string;
  address?: string;
}
