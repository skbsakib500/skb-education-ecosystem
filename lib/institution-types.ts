// ============================================================
// SKB EDUCATION ECOSYSTEM — Institution Type System
// 9 Categories · 47 Types — Premium Grade
// ============================================================

export type InstitutionCategory =
  | "k12"
  | "higher"
  | "medical"
  | "technical"
  | "religious"
  | "coaching"
  | "skills"
  | "creative"
  | "special";

export interface InstitutionTypeMeta {
  value: string;
  label: string;
  bn: string;
  emoji: string;
  category: InstitutionCategory;
}

export const CATEGORIES: Record<InstitutionCategory, { label: string; bn: string; emoji: string }> = {
  k12:       { label: "K-12 Education",     bn: "স্কুল শিক্ষা",         emoji: "🏫" },
  higher:    { label: "Higher Education",   bn: "উচ্চশিক্ষা",           emoji: "🎓" },
  medical:   { label: "Medical & Health",   bn: "চিকিৎসা শিক্ষা",       emoji: "⚕️" },
  technical: { label: "Technical & Engineering", bn: "কারিগরি শিক্ষা",  emoji: "⚙️" },
  religious: { label: "Religious Education",bn: "ধর্মীয় শিক্ষা",        emoji: "🕌" },
  coaching:  { label: "Coaching & Test Prep", bn: "কোচিং ও ভর্তি",      emoji: "📚" },
  skills:    { label: "Skills & Training",  bn: "দক্ষতা প্রশিক্ষণ",      emoji: "🔧" },
  creative:  { label: "Creative & Arts",    bn: "সৃজনশীল শিক্ষা",       emoji: "🎨" },
  special:   { label: "Special Education",  bn: "বিশেষ শিক্ষা",         emoji: "🤝" },
};

export const INSTITUTION_TYPES: InstitutionTypeMeta[] = [
  // ── K-12 Education ──
  { value: "kindergarten",  label: "Kindergarten / Play Group", bn: "কিন্ডারগার্টেন", emoji: "🧸", category: "k12" },
  { value: "primary_school",label: "Primary School",            bn: "প্রাথমিক বিদ্যালয়", emoji: "📖", category: "k12" },
  { value: "high_school",   label: "High School",               bn: "উচ্চ বিদ্যালয়", emoji: "🏫", category: "k12" },
  { value: "secondary",     label: "Secondary School",          bn: "মাধ্যমিক বিদ্যালয়", emoji: "📐", category: "k12" },
  { value: "cadet_college", label: "Cadet College",             bn: "ক্যাডেট কলেজ", emoji: "🎖️", category: "k12" },
  { value: "english_medium",label: "English Medium School",     bn: "ইংরেজি মাধ্যম", emoji: "🌐", category: "k12" },

  // ── Higher Education ──
  { value: "college",       label: "College (HSC)",             bn: "কলেজ (এইচএসসি)", emoji: "🎓", category: "higher" },
  { value: "degree_college",label: "Degree College",            bn: "ডিগ্রি কলেজ", emoji: "🎓", category: "higher" },
  { value: "public_university", label: "Public University",     bn: "পাবলিক বিশ্ববিদ্যালয়", emoji: "🏛️", category: "higher" },
  { value: "private_university", label: "Private University",   bn: "বেসরকারি বিশ্ববিদ্যালয়", emoji: "🏛️", category: "higher" },
  { value: "national_university", label: "National University", bn: "জাতীয় বিশ্ববিদ্যালয়", emoji: "🏛️", category: "higher" },
  { value: "law_college",   label: "Law College",               bn: "আইন কলেজ", emoji: "⚖️", category: "higher" },
  { value: "teachers_training", label: "Teachers Training College", bn: "শিক্ষক প্রশিক্ষণ", emoji: "👨‍🏫", category: "higher" },

  // ── Medical & Health ──
  { value: "medical_college", label: "Medical College (MBBS)",  bn: "মেডিকেল কলেজ", emoji: "⚕️", category: "medical" },
  { value: "dental_college",  label: "Dental College",          bn: "ডেন্টাল কলেজ", emoji: "🦷", category: "medical" },
  { value: "nursing_institute", label: "Nursing Institute",     bn: "নার্সিং ইনস্টিটিউট", emoji: "💉", category: "medical" },
  { value: "pharmacy_college", label: "Pharmacy College",       bn: "ফার্মেসি কলেজ", emoji: "💊", category: "medical" },
  { value: "veterinary_college", label: "Veterinary College",   bn: "ভেটেরিনারি কলেজ", emoji: "🐾", category: "medical" },
  { value: "homeopathy_college", label: "Homeopathy College",   bn: "হোমিওপ্যাথি কলেজ", emoji: "🌿", category: "medical" },
  { value: "ayurvedic_college", label: "Ayurvedic College",     bn: "আয়ুর্বেদিক কলেজ", emoji: "🍃", category: "medical" },

  // ── Technical & Engineering ──
  { value: "engineering_university", label: "Engineering University", bn: "ইঞ্জিনিয়ারিং বিশ্ববিদ্যালয়", emoji: "📐", category: "technical" },
  { value: "polytechnic",   label: "Polytechnic Institute",     bn: "পলিটেকনিক ইনস্টিটিউট", emoji: "⚙️", category: "technical" },
  { value: "textile_institute", label: "Textile Institute",     bn: "টেক্সটাইল ইনস্টিটিউট", emoji: "🧵", category: "technical" },
  { value: "agriculture_university", label: "Agriculture University", bn: "কৃষি বিশ্ববিদ্যালয়", emoji: "🌾", category: "technical" },
  { value: "maritime_academy", label: "Maritime Academy",       bn: "মেরিটাইম একাডেমি", emoji: "⚓", category: "technical" },
  { value: "it_institute",  label: "IT Institute",              bn: "আইটি ইনস্টিটিউট", emoji: "💻", category: "technical" },

  // ── Religious Education ──
  { value: "madrasa",       label: "Madrasa (Dakhil/Alim)",     bn: "মাদ্রাসা (দাখিল/আলিম)", emoji: "🕌", category: "religious" },
  { value: "qawmi_madrasa", label: "Qawmi Madrasa",             bn: "কওমি মাদ্রাসা", emoji: "🕌", category: "religious" },
  { value: "hafizia",       label: "Hafizia Madrasa",           bn: "হাফিজিয়া মাদ্রাসা", emoji: "📖", category: "religious" },
  { value: "islamic_academy", label: "Islamic Academy",         bn: "ইসলামিক একাডেমি", emoji: "🌙", category: "religious" },

  // ── Coaching & Test Prep ──
  { value: "coaching",      label: "General Coaching Center",   bn: "সাধারণ কোচিং", emoji: "📚", category: "coaching" },
  { value: "admission_coaching", label: "Admission Coaching",   bn: "ভর্তি কোচিং", emoji: "🎯", category: "coaching" },
  { value: "bcs_coaching",  label: "BCS / Job Coaching",        bn: "বিসিএস / চাকরি কোচিং", emoji: "📋", category: "coaching" },
  { value: "medical_admission", label: "Medical Admission Coaching", bn: "মেডিকেল ভর্তি", emoji: "⚕️", category: "coaching" },
  { value: "engineering_admission", label: "Engineering Admission", bn: "ইঞ্জিনিয়ারিং ভর্তি", emoji: "📐", category: "coaching" },
  { value: "university_admission", label: "University Admission", bn: "বিশ্ববিদ্যালয় ভর্তি", emoji: "🎓", category: "coaching" },

  // ── Skills & Training ──
  { value: "language_school", label: "Language School",         bn: "ভাষা শিক্ষা", emoji: "🗣️", category: "skills" },
  { value: "driving_school", label: "Driving School",           bn: "ড্রাইভিং স্কুল", emoji: "🚗", category: "skills" },
  { value: "vocational_training", label: "Vocational Training", bn: "বৃত্তিমূলক প্রশিক্ষণ", emoji: "🔧", category: "skills" },
  { value: "beauty_academy", label: "Beauty Academy",           bn: "বিউটি একাডেমি", emoji: "💄", category: "skills" },
  { value: "culinary_school", label: "Culinary School",         bn: "রান্নার স্কুল", emoji: "👨‍🍳", category: "skills" },
  { value: "fashion_design", label: "Fashion Design Institute", bn: "ফ্যাশন ডিজাইন", emoji: "👗", category: "skills" },
  { value: "photography_school", label: "Photography School",   bn: "ফটোগ্রাফি স্কুল", emoji: "📷", category: "skills" },

  // ── Creative & Arts ──
  { value: "music_academy", label: "Music Academy",             bn: "সঙ্গীত একাডেমি", emoji: "🎵", category: "creative" },
  { value: "art_school",    label: "Art School",                bn: "চারুকলা স্কুল", emoji: "🎨", category: "creative" },
  { value: "dance_academy", label: "Dance Academy",             bn: "নৃত্য একাডেমি", emoji: "💃", category: "creative" },
  { value: "film_school",   label: "Film & Drama School",       bn: "নাট্য ও চলচ্চিত্র", emoji: "🎬", category: "creative" },
  { value: "sports_academy",label: "Sports Academy",            bn: "স্পোর্টস একাডেমি", emoji: "🏆", category: "creative" },
  { value: "martial_arts",  label: "Martial Arts Academy",      bn: "মার্শাল আর্টস", emoji: "🥋", category: "creative" },

  // ── Special Education ──
  { value: "special_needs", label: "Special Needs School",      bn: "বিশেষ চাহিদা স্কুল", emoji: "🤝", category: "special" },
  { value: "deaf_blind",    label: "Deaf & Blind Institute",    bn: "বধির ও অন্ধ বিদ্যালয়", emoji: "👁️", category: "special" },
  { value: "autism_center", label: "Autism Center",             bn: "অটিজম সেন্টার", emoji: "💙", category: "special" },
  { value: "orphanage_school", label: "Orphanage / Shelter School", bn: "এতিমখানা স্কুল", emoji: "🏠", category: "special" },

  // ── Other ──
  { value: "other",         label: "Other / Not Listed",        bn: "অন্যান্য", emoji: "⭐", category: "special" },
];

// Helpers
export function getInstitutionMeta(type: string): InstitutionTypeMeta {
  return INSTITUTION_TYPES.find((t) => t.value === type) ?? INSTITUTION_TYPES[INSTITUTION_TYPES.length - 1];
}

export function getTypesByCategory(cat: InstitutionCategory): InstitutionTypeMeta[] {
  return INSTITUTION_TYPES.filter((t) => t.category === cat);
}

// For dropdown rendering
export function getGroupedTypes(): Array<{ category: InstitutionCategory; meta: typeof CATEGORIES[InstitutionCategory]; items: InstitutionTypeMeta[] }> {
  const order: InstitutionCategory[] = ["k12","higher","medical","technical","religious","coaching","skills","creative","special"];
  return order.map((cat) => ({
    category: cat,
    meta: CATEGORIES[cat],
    items: getTypesByCategory(cat),
  }));
}
