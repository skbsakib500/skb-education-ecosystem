export const ROLES = [
  { key: "owner",       emoji: "🏛️", label: "Institution Owner", bn: "প্রতিষ্ঠান পরিচালক", desc: "নিজের প্রতিষ্ঠান তৈরি ও পরিচালনা করুন", color: "#10b981" },
  { key: "teacher",     emoji: "👨‍🏫", label: "Teacher",           bn: "শিক্ষক",            desc: "বিদ্যমান প্রতিষ্ঠানে যুক্ত হন",     color: "#8b5cf6" },
  { key: "student",     emoji: "🎓", label: "Student",           bn: "শিক্ষার্থী",         desc: "পরীক্ষা, ফলাফল, রুটিন",           color: "#06b6d4" },
  { key: "parent",      emoji: "👪", label: "Parent / Guardian", bn: "অভিভাবক",          desc: "সন্তানের অগ্রগতি দেখুন",         color: "#14b8a6" },
  { key: "staff",       emoji: "💼", label: "Staff",             bn: "কর্মী",             desc: "Accountant, Librarian, Receptionist", color: "#f59e0b" },
  { key: "independent", emoji: "🎯", label: "Independent",       bn: "স্বতন্ত্র",          desc: "Tutor, Self-learner, Creator",   color: "#f43f5e" },
] as const;

export const SUB_ROLES = {
  staff: [
    { key: "accountant",   label: "Accountant",   bn: "হিসাবরক্ষক", emoji: "💰" },
    { key: "librarian",    label: "Librarian",    bn: "লাইব্রেরিয়ান", emoji: "📚" },
    { key: "receptionist", label: "Receptionist", bn: "রিসেপশনিস্ট", emoji: "☎️" },
  ],
  independent: [
    { key: "tutor",     label: "Private Tutor",   bn: "প্রাইভেট টিউটর", emoji: "📖" },
    { key: "self",      label: "Self Learner",    bn: "স্ব-শিক্ষা",       emoji: "🎯" },
    { key: "creator",   label: "Content Creator", bn: "কনটেন্ট ক্রিয়েটর", emoji: "✍️" },
  ],
} as const;

export const INTERESTS = [
  "Physics","Chemistry","Biology","Mathematics","English","Bangla","ICT",
  "Accounting","Business","Economics","History","Geography","Civics",
  "Arabic","Islamic Studies","Computer Science","Arts","Music",
];

export const GOALS = {
  student: ["Exam Prep","Skill Building","Homework Help","Career Guidance"],
  independent: ["Learn New Skill","Teach Others","Build Portfolio","Earn Money"],
} as const;
