// ============================================================
// SKB EDUCATION — Complete Bangladesh Education Boards/Councils
// 10 Categories · 60+ Boards/Affiliations
// Source: Official BD Govt + International Curricula
// ============================================================

export type BoardCategory =
  | "general_education"       // 11 govt. boards
  | "madrasah"                // General madrasah boards
  | "qawmi_madrasah"          // Qawmi boards
  | "technical"               // Technical education boards
  | "medical_councils"        // Medical & health councils
  | "engineering_professional"// Engineering & professional councils
  | "university"              // University affiliations
  | "international"           // Cambridge/Edexcel/IB
  | "specialized"             // Specialized councils
  | "unregulated";            // None / independent

export interface EducationBoard {
  value: string;
  label: string;
  bn: string;
  emoji: string;
  category: BoardCategory;
}

export const BOARD_CATEGORIES: Record<BoardCategory, { label: string; bn: string; emoji: string }> = {
  general_education:       { label: "General Education Boards", bn: "সাধারণ শিক্ষা বোর্ড",       emoji: "📘" },
  madrasah:                { label: "Madrasah Boards",          bn: "মাদ্রাসা বোর্ড",             emoji: "🕌" },
  qawmi_madrasah:          { label: "Qawmi Madrasah Boards",    bn: "কওমি মাদ্রাসা বোর্ড",         emoji: "🕌" },
  technical:               { label: "Technical Education",       bn: "কারিগরি শিক্ষা বোর্ড",        emoji: "⚙️" },
  medical_councils:        { label: "Medical & Health Councils", bn: "চিকিৎসা কাউন্সিল",            emoji: "⚕️" },
  engineering_professional:{ label: "Engineering & Professional",bn: "ইঞ্জিনিয়ারিং ও পেশা কাউন্সিল", emoji: "📐" },
  university:              { label: "University Affiliation",    bn: "বিশ্ববিদ্যালয় অধিভুক্তি",    emoji: "🏛️" },
  international:           { label: "International Curricula",   bn: "আন্তর্জাতিক কারিকুলাম",       emoji: "🌐" },
  specialized:             { label: "Specialized Councils",      bn: "বিশেষায়িত কাউন্সিল",        emoji: "🎯" },
  unregulated:             { label: "Not Applicable",            bn: "প্রযোজ্য নয়",               emoji: "⭐" },
};

export const EDUCATION_BOARDS: EducationBoard[] = [
  // ── General Education Boards (11) ──
  { value: "dhaka_board",       label: "Dhaka Education Board",           bn: "ঢাকা শিক্ষা বোর্ড",           emoji: "📘", category: "general_education" },
  { value: "chittagong_board",  label: "Chittagong Education Board",      bn: "চট্টগ্রাম শিক্ষা বোর্ড",       emoji: "📘", category: "general_education" },
  { value: "rajshahi_board",    label: "Rajshahi Education Board",        bn: "রাজশাহী শিক্ষা বোর্ড",        emoji: "📘", category: "general_education" },
  { value: "khulna_board",      label: "Khulna Education Board",          bn: "খুলনা শিক্ষা বোর্ড",          emoji: "📘", category: "general_education" },
  { value: "barishal_board",    label: "Barishal Education Board",        bn: "বরিশাল শিক্ষা বোর্ড",         emoji: "📘", category: "general_education" },
  { value: "sylhet_board",      label: "Sylhet Education Board",          bn: "সিলেট শিক্ষা বোর্ড",          emoji: "📘", category: "general_education" },
  { value: "dinajpur_board",    label: "Dinajpur Education Board",        bn: "দিনাজপুর শিক্ষা বোর্ড",       emoji: "📘", category: "general_education" },
  { value: "mymensingh_board",  label: "Mymensingh Education Board",      bn: "ময়মনসিংহ শিক্ষা বোর্ড",      emoji: "📘", category: "general_education" },
  { value: "cumilla_board",     label: "Cumilla Education Board",         bn: "কুমিল্লা শিক্ষা বোর্ড",       emoji: "📘", category: "general_education" },
  { value: "jashore_board",     label: "Jashore Education Board",         bn: "যশোর শিক্ষা বোর্ড",           emoji: "📘", category: "general_education" },
  { value: "bise_bangladesh",   label: "Bangladesh Inter-Education Board",bn: "বাংলাদেশ আন্তঃশিক্ষা বোর্ড",   emoji: "📘", category: "general_education" },

  // ── Madrasah Boards ──
  { value: "b_meb",             label: "Bangladesh Madrasah Education Board", bn: "বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড", emoji: "🕌", category: "madrasah" },
  { value: "islamic_university_affil", label: "Islamic University Affiliation", bn: "ইসলামী বিশ্ববিদ্যালয় অধিভুক্তি", emoji: "🕌", category: "madrasah" },

  // ── Qawmi Madrasah Boards ──
  { value: "befaq",             label: "Befaqul Madarisil Arabia Bangladesh", bn: "বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ", emoji: "🕌", category: "qawmi_madrasah" },
  { value: "al_haiatul_ulya",   label: "Al-Haiatul Ulya Lil-Jamiatil Qawmiya", bn: "আল-হাইআতুল উলয়া",           emoji: "🕌", category: "qawmi_madrasah" },
  { value: "tanzimul_madaris",  label: "Tanzimul Madaris Bangladesh",          bn: "তানজিমুল মাদারিস",           emoji: "🕌", category: "qawmi_madrasah" },
  { value: "rah_e_talim",       label: "Rah-e-Talim Bangladesh",               bn: "রাহে তালিম",                 emoji: "🕌", category: "qawmi_madrasah" },

  // ── Technical Education Boards ──
  { value: "bteb",              label: "Bangladesh Technical Education Board (BTEB)", bn: "বাংলাদেশ কারিগরি শিক্ষা বোর্ড", emoji: "⚙️", category: "technical" },
  { value: "bmeb_tech",         label: "Technical Madrasah Board",            bn: "কারিগরি মাদ্রাসা বোর্ড",       emoji: "⚙️", category: "technical" },

  // ── Medical & Health Councils ──
  { value: "bmdC",              label: "Bangladesh Medical & Dental Council", bn: "বাংলাদেশ মেডিকেল ও ডেন্টাল কাউন্সিল", emoji: "⚕️", category: "medical_councils" },
  { value: "bnmc",              label: "Bangladesh Nursing & Midwifery Council", bn: "বাংলাদেশ নার্সিং ও মিডওয়াইফারি কাউন্সিল", emoji: "💉", category: "medical_councils" },
  { value: "pcb",               label: "Pharmacy Council of Bangladesh",      bn: "ফার্মেসি কাউন্সিল অব বাংলাদেশ", emoji: "💊", category: "medical_councils" },
  { value: "bvc",               label: "Bangladesh Veterinary Council",       bn: "বাংলাদেশ ভেটেরিনারি কাউন্সিল",  emoji: "🐾", category: "medical_councils" },
  { value: "bmrce",             label: "Bangladesh Homeopathy Board",         bn: "বাংলাদেশ হোমিওপ্যাথি বোর্ড",   emoji: "🌿", category: "medical_councils" },
  { value: "bagmr",             label: "Ayurvedic & Unani Board",             bn: "আয়ুর্বেদিক ও ইউনানী বোর্ড",     emoji: "🍃", category: "medical_councils" },
  { value: "bpsi",              label: "Bangladesh Physiotherapy Society",    bn: "বাংলাদেশ ফিজিওথেরাপি সোসাইটি",   emoji: "🩺", category: "medical_councils" },

  // ── Engineering & Professional Councils ──
  { value: "ieb",               label: "Institution of Engineers, Bangladesh (IEB)", bn: "ইঞ্জিনিয়ার্স ইনস্টিটিউশন, বাংলাদেশ", emoji: "📐", category: "engineering_professional" },
  { value: "bcsir",             label: "BCSIR Certification",                 bn: "বিসিএসআইআর",                  emoji: "🔬", category: "engineering_professional" },
  { value: "bcs_committee",     label: "Bangladesh Computer Council (BCC)",   bn: "বাংলাদেশ কম্পিউটার কাউন্সিল",   emoji: "💻", category: "engineering_professional" },
  { value: "bar_council",       label: "Bangladesh Bar Council",              bn: "বাংলাদেশ বার কাউন্সিল",         emoji: "⚖️", category: "engineering_professional" },
  { value: "icab",              label: "Institute of Chartered Accountants (ICAB)", bn: "আইসিএবি",                emoji: "📊", category: "engineering_professional" },
  { value: "icmab",             label: "Institute of Cost & Management Accountants (ICMAB)", bn: "আইসিএমএবি", emoji: "📈", category: "engineering_professional" },
  { value: "bba_bd",            label: "Bangladesh Bankers Association",      bn: "বাংলাদেশ ব্যাংকার্স অ্যাসোসিয়েশন", emoji: "🏦", category: "engineering_professional" },

  // ── University Affiliation ──
  { value: "ugc_bd",            label: "University Grants Commission (UGC)", bn: "বিশ্ববিদ্যালয় মঞ্জুরি কমিশন",   emoji: "🏛️", category: "university" },
  { value: "nu_bd",             label: "National University Bangladesh",     bn: "জাতীয় বিশ্ববিদ্যালয়",          emoji: "🏛️", category: "university" },
  { value: "bou",               label: "Bangladesh Open University",         bn: "বাংলাদেশ উন্মুক্ত বিশ্ববিদ্যালয়", emoji: "🏛️", category: "university" },
  { value: "islamic_uni_bd",    label: "Islamic University, Bangladesh",     bn: "ইসলামী বিশ্ববিদ্যালয়",          emoji: "🏛️", category: "university" },
  { value: "independent_uni",   label: "Independent University (Self-Governed)", bn: "স্বাধীন বিশ্ববিদ্যালয়",       emoji: "🏛️", category: "university" },

  // ── International Curricula ──
  { value: "cambridge",         label: "Cambridge (CIE — IGCSE/A-Level)",    bn: "কেমব্রিজ (IGCSE/A-Level)",     emoji: "🌐", category: "international" },
  { value: "edexcel",           label: "Pearson Edexcel",                     bn: "পিয়ারসন এডেক্সেল",            emoji: "🌐", category: "international" },
  { value: "ib",                label: "International Baccalaureate (IB)",    bn: "ইন্টারন্যাশনাল ব্যাকালরেট",      emoji: "🌐", category: "international" },
  { value: "ib_dp",             label: "IB Diploma Programme",                bn: "আইবি ডিপ্লোমা",               emoji: "🌐", category: "international" },
  { value: "oxford_aqa",        label: "Oxford AQA",                          bn: "অক্সফোর্ড AQA",               emoji: "🌐", category: "international" },
  { value: "baccalaureate_fr",  label: "French Baccalaureate",                bn: "ফ্রেঞ্চ ব্যাকালরেট",          emoji: "🌐", category: "international" },

  // ── Specialized Councils ──
  { value: "btc_bd",            label: "Bangladesh Technical Council",        bn: "বাংলাদেশ টেকনিক্যাল কাউন্সিল",  emoji: "🎯", category: "specialized" },
  { value: "bise_madrasah",     label: "Madrasah Education Training Institute", bn: "মাদ্রাসা শিক্ষা প্রশিক্ষণ ইনস্টিটিউট", emoji: "🎯", category: "specialized" },
  { value: "bmc_bd",            label: "Bangladesh Medical Council",          bn: "বাংলাদেশ মেডিকেল কাউন্সিল",     emoji: "🎯", category: "specialized" },
  { value: "ngoaffairs",        label: "NGO Affairs Bureau (for NGO schools)", bn: "এনজিও অ্যাফেয়ার্স ব্যুরো",      emoji: "🎯", category: "specialized" },

  // ── Not Applicable / Independent ──
  { value: "none",              label: "None / Independent",                  bn: "প্রযোজ্য নয় / স্বাধীন",        emoji: "⭐", category: "unregulated" },
  { value: "other_board",       label: "Other (Not Listed)",                  bn: "অন্যান্য",                    emoji: "⭐", category: "unregulated" },
];

export function getBoardMeta(value: string): EducationBoard {
  return EDUCATION_BOARDS.find((b) => b.value === value) ?? EDUCATION_BOARDS[EDUCATION_BOARDS.length - 2];
}

export function getBoardsByCategory(cat: BoardCategory): EducationBoard[] {
  return EDUCATION_BOARDS.filter((b) => b.category === cat);
}

export function getGroupedBoards(): Array<{ category: BoardCategory; meta: typeof BOARD_CATEGORIES[BoardCategory]; items: EducationBoard[] }> {
  const order: BoardCategory[] = [
    "general_education",
    "madrasah",
    "qawmi_madrasah",
    "technical",
    "medical_councils",
    "engineering_professional",
    "university",
    "international",
    "specialized",
    "unregulated",
  ];
  return order.map((cat) => ({
    category: cat,
    meta: BOARD_CATEGORIES[cat],
    items: getBoardsByCategory(cat),
  }));
}
