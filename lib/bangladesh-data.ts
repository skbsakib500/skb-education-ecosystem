// ============================================================
// SKB EDUCATION — Bangladesh Location Master Data
// 8 Divisions · 64 Districts · Bengali + English
// ============================================================

export interface LocationItem {
  value: string;
  label: string;
  bn: string;
}

export const DIVISIONS: LocationItem[] = [
  { value: "dhaka",        label: "Dhaka",        bn: "ঢাকা" },
  { value: "chittagong",   label: "Chittagong",   bn: "চট্টগ্রাম" },
  { value: "rajshahi",     label: "Rajshahi",     bn: "রাজশাহী" },
  { value: "khulna",       label: "Khulna",       bn: "খুলনা" },
  { value: "barishal",     label: "Barishal",     bn: "বরিশাল" },
  { value: "sylhet",       label: "Sylhet",       bn: "সিলেট" },
  { value: "rangpur",      label: "Rangpur",      bn: "রংপুর" },
  { value: "mymensingh",   label: "Mymensingh",   bn: "ময়মনসিংহ" },
];

export const DISTRICTS_BY_DIVISION: Record<string, LocationItem[]> = {
  dhaka: [
    { value: "dhaka",         label: "Dhaka",           bn: "ঢাকা" },
    { value: "gazipur",       label: "Gazipur",         bn: "গাজীপুর" },
    { value: "narayanganj",   label: "Narayanganj",     bn: "নারায়ণগঞ্জ" },
    { value: "tangail",       label: "Tangail",         bn: "টাঙ্গাইল" },
    { value: "kishoreganj",   label: "Kishoreganj",     bn: "কিশোরগঞ্জ" },
    { value: "manikganj",     label: "Manikganj",       bn: "মানিকগঞ্জ" },
    { value: "munshiganj",    label: "Munshiganj",      bn: "মুন্সিগঞ্জ" },
    { value: "narsingdi",     label: "Narsingdi",       bn: "নরসিংদী" },
    { value: "faridpur",      label: "Faridpur",        bn: "ফরিদপুর" },
    { value: "gopalganj",     label: "Gopalganj",       bn: "গোপালগঞ্জ" },
    { value: "madaripur",     label: "Madaripur",       bn: "মাদারীপুর" },
    { value: "rajbari",       label: "Rajbari",         bn: "রাজবাড়ী" },
    { value: "shariatpur",    label: "Shariatpur",      bn: "শরীয়তপুর" },
  ],
  chittagong: [
    { value: "chittagong",    label: "Chittagong",      bn: "চট্টগ্রাম" },
    { value: "coxsbazar",     label: "Cox's Bazar",     bn: "কক্সবাজার" },
    { value: "cumilla",       label: "Cumilla",         bn: "কুমিল্লা" },
    { value: "brahmanbaria",  label: "Brahmanbaria",    bn: "ব্রাহ্মণবাড়িয়া" },
    { value: "chandpur",      label: "Chandpur",        bn: "চাঁদপুর" },
    { value: "feni",          label: "Feni",            bn: "ফেনী" },
    { value: "lakshmipur",    label: "Lakshmipur",      bn: "লক্ষ্মীপুর" },
    { value: "noakhali",      label: "Noakhali",        bn: "নোয়াখালী" },
    { value: "khagrachhari",  label: "Khagrachhari",    bn: "খাগড়াছড়ি" },
    { value: "rangamati",     label: "Rangamati",       bn: "রাঙ্গামাটি" },
    { value: "bandarban",     label: "Bandarban",       bn: "বান্দরবান" },
  ],
  rajshahi: [
    { value: "rajshahi",      label: "Rajshahi",        bn: "রাজশাহী" },
    { value: "bogura",        label: "Bogura",          bn: "বগুড়া" },
    { value: "joypurhat",     label: "Joypurhat",       bn: "জয়পুরহাট" },
    { value: "naogaon",       label: "Naogaon",         bn: "নওগাঁ" },
    { value: "natore",        label: "Natore",          bn: "নাটোর" },
    { value: "chapainawabganj", label: "Chapainawabganj", bn: "চাঁপাইনবাবগঞ্জ" },
    { value: "pabna",         label: "Pabna",           bn: "পাবনা" },
    { value: "sirajganj",     label: "Sirajganj",       bn: "সিরাজগঞ্জ" },
  ],
  khulna: [
    { value: "khulna",        label: "Khulna",          bn: "খুলনা" },
    { value: "bagerhat",      label: "Bagerhat",        bn: "বাগেরহাট" },
    { value: "chuadanga",     label: "Chuadanga",       bn: "চুয়াডাঙ্গা" },
    { value: "jashore",       label: "Jashore",         bn: "যশোর" },
    { value: "jhenaidah",     label: "Jhenaidah",       bn: "ঝিনাইদহ" },
    { value: "kushtia",       label: "Kushtia",         bn: "কুষ্টিয়া" },
    { value: "magura",        label: "Magura",          bn: "মাগুরা" },
    { value: "meherpur",      label: "Meherpur",        bn: "মেহেরপুর" },
    { value: "narail",        label: "Narail",          bn: "নড়াইল" },
    { value: "satkhira",      label: "Satkhira",        bn: "সাতক্ষীরা" },
  ],
  barishal: [
    { value: "barishal",      label: "Barishal",        bn: "বরিশাল" },
    { value: "barguna",       label: "Barguna",         bn: "বরগুনা" },
    { value: "bhola",         label: "Bhola",           bn: "ভোলা" },
    { value: "jhalokati",     label: "Jhalokati",       bn: "ঝালকাঠি" },
    { value: "patuakhali",    label: "Patuakhali",      bn: "পটুয়াখালী" },
    { value: "pirojpur",      label: "Pirojpur",        bn: "পিরোজপুর" },
  ],
  sylhet: [
    { value: "sylhet",        label: "Sylhet",          bn: "সিলেট" },
    { value: "habiganj",      label: "Habiganj",        bn: "হবিগঞ্জ" },
    { value: "moulvibazar",   label: "Moulvibazar",     bn: "মৌলভীবাজার" },
    { value: "sunamganj",     label: "Sunamganj",       bn: "সুনামগঞ্জ" },
  ],
  rangpur: [
    { value: "rangpur",       label: "Rangpur",         bn: "রংপুর" },
    { value: "dinajpur",      label: "Dinajpur",        bn: "দিনাজপুর" },
    { value: "gaibandha",     label: "Gaibandha",       bn: "গাইবান্ধা" },
    { value: "kurigram",      label: "Kurigram",        bn: "কুড়িগ্রাম" },
    { value: "lalmonirhat",   label: "Lalmonirhat",     bn: "লালমনিরহাট" },
    { value: "nilphamari",    label: "Nilphamari",      bn: "নীলফামারী" },
    { value: "panchagarh",    label: "Panchagarh",      bn: "পঞ্চগড়" },
    { value: "thakurgaon",    label: "Thakurgaon",      bn: "ঠাকুরগাঁও" },
  ],
  mymensingh: [
    { value: "mymensingh",    label: "Mymensingh",      bn: "ময়মনসিংহ" },
    { value: "jamalpur",      label: "Jamalpur",        bn: "জামালপুর" },
    { value: "netrokona",     label: "Netrokona",       bn: "নেত্রকোণা" },
    { value: "sherpur",       label: "Sherpur",         bn: "শেরপুর" },
  ],
};

export function getDistricts(division: string): LocationItem[] {
  return DISTRICTS_BY_DIVISION[division] ?? [];
}

export function getDistrictMeta(division: string, district: string): LocationItem | undefined {
  return getDistricts(division).find((d) => d.value === district);
}

export function getDivisionMeta(division: string): LocationItem | undefined {
  return DIVISIONS.find((d) => d.value === division);
}
