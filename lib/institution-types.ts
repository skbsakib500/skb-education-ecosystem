export const INSTITUTION_TYPES = [
  { value: "school",     label: "School",         bn: "স্কুল",           emoji: "🏫" },
  { value: "college",    label: "College",        bn: "কলেজ",            emoji: "🎓" },
  { value: "university", label: "University",     bn: "বিশ্ববিদ্যালয়",   emoji: "🏛️" },
  { value: "institute",  label: "Institute",      bn: "ইনস্টিটিউট",       emoji: "🔬" },
  { value: "coaching",   label: "Coaching Center",bn: "কোচিং সেন্টার",    emoji: "📚" },
  { value: "madrasa",    label: "Madrasa",        bn: "মাদ্রাসা",         emoji: "🕌" },
  { value: "other",      label: "Other",          bn: "অন্যান্য",         emoji: "⭐" },
] as const;

export type InstitutionType = typeof INSTITUTION_TYPES[number]["value"];

export function getInstitutionMeta(type: string) {
  return INSTITUTION_TYPES.find((t) => t.value === type) ?? INSTITUTION_TYPES[6];
}
