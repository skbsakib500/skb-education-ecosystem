import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Role = "admin" | "teacher" | "student" | "parent" | "accountant";

export type Institution = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
};

export type Membership = {
  id: string;
  institution_id: string;
  role: Role;
  institution?: Institution;
};
