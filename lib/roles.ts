import { ROLES } from "./onboarding";

export type RoleKey = (typeof ROLES)[number]["key"];

const ROLE_KEYS: readonly string[] = ROLES.map((r) => r.key);

export function isValidRole(v: string | null | undefined): v is RoleKey {
  return !!v && ROLE_KEYS.includes(v);
}

export function getRole(key: string) {
  return ROLES.find((r) => r.key === key) || null;
}
