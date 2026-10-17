// Landing page content — single source of truth
// Any change here reflects automatically on the landing page.

export type UseCase = {
  role: string;
  emoji: string;
  title: string;
  titleBn: string;
  desc: string;
  cta: string;
  href: string;
};

export const USE_CASES: UseCase[] = [
  {
    role: "owner",
    emoji: "🏛️",
    title: "Institution Owner",
    titleBn: "প্রতিষ্ঠান মালিক",
    desc: "আপনার নিজের admin panel — ক্লাস, শিক্ষক, ফি, রিপোর্ট সব এক জায়গায়।",
    cta: "Register Institution",
    href: "/get-started/",
  },
  {
    role: "teacher",
    emoji: "👨‍🏫",
    title: "Teacher",
    titleBn: "শিক্ষক",
    desc: "ক্লাস, অ্যাসাইনমেন্ট, পরীক্ষা, মেসেজ — সব digital, সব সংগঠিত।",
    cta: "Join as Teacher",
    href: "/signup/?role=teacher",
  },
  {
    role: "student",
    emoji: "🎓",
    title: "Student",
    titleBn: "শিক্ষার্থী",
    desc: "NCTB-aligned materials, MCQ practice, AI Tutor — ২৪/৭।",
    cta: "Start Learning",
    href: "/signup/?role=student",
  },
  {
    role: "tutor",
    emoji: "📚",
    title: "Tutor",
    titleBn: "টিউটর",
    desc: "পড়ান, স্টুডেন্ট পান, রিভিউ পান — Marketplace-এ list হোন।",
    cta: "Become a Tutor",
    href: "/tutors/become/",
  },
];

export type Feature = {
  emoji: string;
  title: string;
  titleBn: string;
  desc: string;
  href?: string;
};

export const FEATURES: Feature[] = [
  {
    emoji: "🏛️",
    title: "Multi-Tenant",
    titleBn: "বহু প্রতিষ্ঠান",
    desc: "এক সফটওয়্যার — হাজারো স্কুল, কলেজ, কোচিং। সম্পূর্ণ data isolation।",
  },
  {
    emoji: "🔐",
    title: "Privacy First",
    titleBn: "গোপনীয়তা সুরক্ষিত",
    desc: "প্রতি field আলাদা visibility। নিজের profile নিজে নিয়ন্ত্রণ করুন।",
    href: "/settings/privacy/",
  },
  {
    emoji: "🛡️",
    title: "Moderation",
    titleBn: "কমিউনিটি নিরাপত্তা",
    desc: "105+ banned words, auto-hide, admin review — সম্পূর্ণ নিরাপদ।",
    href: "/feed/",
  },
  {
    emoji: "✅",
    title: "Verification",
    titleBn: "যাচাই ব্যবস্থা",
    desc: "শিক্ষক, প্রতিষ্ঠান, অভিভাবক — verified badges দিয়ে বিশ্বাসযোগ্যতা।",
    href: "/verification/",
  },
  {
    emoji: "📚",
    title: "NCTB Curriculum",
    titleBn: "এনসিটিবি কারিকুলাম",
    desc: "Class 6-12 এর জন্য official materials, MCQ, CQ প্র্যাকটিস।",
    href: "/materials/",
  },
  {
    emoji: "🤖",
    title: "AI Tutor",
    titleBn: "এআই টিউটর",
    desc: "২৪/৭ AI-সহায়ক। প্রশ্ন, ব্যাখ্যা, প্র্যাকটিস প্রশ্ন।",
    href: "/ai-tutor/",
  },
];

export type PricingTier = {
  name: string;
  nameBn: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
};

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    nameBn: "ফ্রি",
    price: "৳0",
    period: "forever",
    features: ["1 institution", "50 students", "Core features", "Community access"],
    cta: "Start Free",
    ctaHref: "/get-started/",
  },
  {
    name: "Growth",
    nameBn: "গ্রোথ",
    price: "৳2,999",
    period: "/month",
    features: [
      "Unlimited students",
      "Custom branding",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Choose Growth",
    ctaHref: "/pricing/",
    highlighted: true,
  },
  {
    name: "Enterprise",
    nameBn: "এন্টারপ্রাইজ",
    price: "Custom",
    period: "",
    features: ["Multi-branch", "Dedicated support", "API access", "SLA guarantee"],
    cta: "Contact Sales",
    ctaHref: "/contact/",
  },
];
