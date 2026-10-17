# SKB EDUCATION ECOSYSTEM — AI Handoff Context

> যেকোনো নতুন AI-কে এই ফাইল paste করলে সে সাথে সাথে 
> project-এর পুরো context পেয়ে যাবে।

---

## 🏛️ Project Overview

- Name: SKB Education Ecosystem
- Founder: SKB Sakib (skbsakib500 / msakibalmhamud5@gmail.com)
- Type: Multi-Tenant EdTech SaaS Platform
- Vision: একটি সফটওয়্যার — অসংখ্য স্কুল/কলেজ/কোচিং নিজের admin দিয়ে পরিচালনা করবে
- Business Model: B2B SaaS (institution subscription)
- Target: Bangladesh Full Education System, পরে International

---

## 🛠️ Tech Stack

- Frontend: Next.js 14.2.35 (App Router, static export)
- Styling: Tailwind CSS 3.4.14
- Language: TypeScript 5.5.4
- Icons: lucide-react 0.454.0
- Auth: Supabase Auth (email/password)
- DB: Supabase PostgreSQL (ref: ufabshfxxjxwhxmzmwnn)
- Storage: Supabase bucket institution-logos
- Hosting: GitHub Pages (static)
- CI/CD: GitHub Actions (auto-deploy on push to main)
- Dev Environment: Termux (Android) + pnpm + git

---

## 🌐 URLs

- Live: https://skbsakib500.github.io/skb-education-ecosystem/
- Repo: https://github.com/skbsakib500/skb-education-ecosystem
- Supabase: https://supabase.com/dashboard/project/ufabshfxxjxwhxmzmwnn
- Actions: https://github.com/skbsakib500/skb-education-ecosystem/actions

---

## 📁 Local Setup (Termux)

Project path: ~/projects/skb-education-ecosystem

Credentials (in ~/. folder, NEVER in git):
- ~/.skb-supabase-token — Supabase Personal Access Token (sbp_...)
- ~/.skb-supabase-ref — Project ref: ufabshfxxjxwhxmzmwnn
- ~/.git-credentials — GitHub token (ghp_...)

Git config: skbsakib500 / msakibalmhamud5@gmail.com

.env.local (gitignored):
NEXT_PUBLIC_SUPABASE_URL=https://ufabshfxxjxwhxmzmwnn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_KGVRMzfOuYV_25c7nUY-hA_7pDMDuLi

Same values are in GitHub Secrets.

---

## 🗄️ Database Schema

Tables (public schema):
- institutions (id, name, slug, type, status, owner_email, logo_url, emoji, division, city, education_board, contact_phone, contact_email, description, motto, established_year, created_at)
- profiles (id → auth.users, email, full_name, avatar_url, created_at)
- memberships (id, institution_id, user_id, role, status, created_at; role = admin/teacher/student/parent/accountant)
- classes (id, institution_id, name, section, created_at)
- students (id, institution_id, user_id, class_id, roll_number, full_name, created_at)

Helper Functions (SECURITY DEFINER):
- is_member_of(inst_id uuid) → boolean
- is_admin_of(inst_id uuid) → boolean

Trigger: on_auth_user_created → auto-insert into profiles

Storage: institution-logos bucket (public read)
- Path: institution-logos/{institution_id}/logo.{ext}
- Upload/Update/Delete ONLY if is_admin_of(institution_id)

---

## 🔐 Security Rules (CRITICAL)

1. Institution logo ownership
   - Storage path has institution_id
   - Only that institution's admin can upload/update/delete
   - Anonymous users: read only

2. Institution create with logo (correct order)
   - Step 1: INSERT institution (logo_url = null)
   - Step 2: INSERT membership (role = admin)
   - Step 3: NOW upload logo (is_admin_of passes)
   - Step 4: UPDATE institution.logo_url

3. RLS gotchas
   - auth.role() is DEPRECATED in 2025 Supabase → use auth.uid() is not null
   - NEVER reference same table in its own policy → use SECURITY DEFINER helpers
   - Recursive policies cause "infinite recursion detected"

4. basePath gotcha (Next.js)
   - router.push("/login/") — OK (Next.js adds basePath)
   - router.push("/skb-education-ecosystem/login/") — WRONG (double prefix)
   - window.location.href needs FULL path including basePath

---

## 🗂️ File Structure

skb-education-ecosystem/
├── app/
│   ├── globals.css              — Theme CSS variables
│   ├── layout.tsx               — Root with AuthProvider
│   ├── page.tsx                 — Landing (hero, features, CTA)
│   ├── login/page.tsx           — Login
│   ├── signup/page.tsx          — Signup (2-step)
│   ├── dashboard/page.tsx       — Protected, list institutions
│   └── institutions/new/page.tsx — Create institution
├── lib/
│   ├── supabase.ts              — Client + types
│   ├── auth.tsx                 — AuthProvider + useAuth
│   ├── data.ts                  — Mock data
│   ├── institution-types.ts     — 47 types, 9 categories
│   ├── bangladesh-data.ts       — 8 divisions, 64 districts
│   └── education-boards.ts      — 60+ boards, 10 categories
├── db/
│   ├── migrations/*.sql         — 5 migration files
│   ├── migrate.sh               — Run all migrations via API
│   ├── verify.sh                — Verify DB state
│   └── sql.sh                   — Ad-hoc SQL runner
├── .github/workflows/deploy.yml — Actions → Pages
├── next.config.mjs              — basePath config
├── package.json
├── tailwind.config.ts
└── CONTEXT.md                   — This file

---

## 🎓 Institution Type System

File: lib/institution-types.ts
47 types across 9 categories:

k12 (6): kindergarten, primary_school, high_school, secondary, cadet_college, english_medium
higher (7): college, degree_college, public_university, private_university, national_university, law_college, teachers_training
medical (7): medical_college, dental_college, nursing_institute, pharmacy_college, veterinary_college, homeopathy_college, ayurvedic_college
technical (6): engineering_university, polytechnic, textile_institute, agriculture_university, maritime_academy, it_institute
religious (4): madrasa, qawmi_madrasa, hafizia, islamic_academy
coaching (6): coaching, admission_coaching, bcs_coaching, medical_admission, engineering_admission, university_admission
skills (7): language_school, driving_school, vocational_training, beauty_academy, culinary_school, fashion_design, photography_school
creative (6): music_academy, art_school, dance_academy, film_school, sports_academy, martial_arts
special (4): special_needs, deaf_blind, autism_center, orphanage_school

Usage: getGroupedTypes(), getInstitutionMeta(type)

---

## 📍 Bangladesh Location

File: lib/bangladesh-data.ts

8 Divisions: dhaka, chittagong, rajshahi, khulna, barishal, sylhet, rangpur, mymensingh
64 Districts mapped by division.

Usage: DIVISIONS, getDistricts(division), getDivisionMeta(div), getDistrictMeta(div, dist)

---

## 🎓 Education Boards

File: lib/education-boards.ts
60+ boards across 10 categories:

general_education (11): All 8 BISE + Cumilla + Jashore + Inter-Board
madrasah (2): BMEB, Islamic University Affiliation
qawmi_madrasah (4): Befaq, Al-Haiatul Ulya, Tanzimul Madaris, Rah-e-Talim
technical (2): BTEB, Technical Madrasah Board
medical_councils (7): BMDC, BNMC, PCB, BVC, Homeopathy, Ayurvedic, Physiotherapy
engineering_professional (7): IEB, BCSIR, BCC, Bar Council, ICAB, ICMAB, Bankers
university (5): UGC, NU, BOU, Islamic Uni, Independent
international (6): Cambridge, Edexcel, IB, AQA, French Bac
specialized (4): BTC, Madrasah Training, Medical Council, NGO Affairs
unregulated (2): None, Other

Usage: getGroupedBoards(), getBoardMeta(value)

---

## 🚀 Deploy Workflow

From Termux:
  cd ~/projects/skb-education-ecosystem
  git add -A
  git commit -m "message"
  git push

GitHub Actions auto-runs (2 min):
1. Checkout
2. Setup Node 20 + pnpm 9.15.0
3. pnpm install --no-frozen-lockfile
4. pnpm build (with env from secrets)
5. Upload out/ to GitHub Pages

View logs: https://github.com/skbsakib500/skb-education-ecosystem/actions

---

## 💾 Database Migration Workflow

Setup (one-time):
  pkg install -y curl jq
  read -rsp "Token: " T && printf '%s' "$T" > ~/.skb-supabase-token && unset T
  printf '%s' 'ufabshfxxjxwhxmzmwnn' > ~/.skb-supabase-ref
  chmod 600 ~/.skb-supabase-*

Run migrations:
  bash db/migrate.sh

Ad-hoc queries:
  ./db/sql.sh "select * from institutions;"

Verify:
  bash db/verify.sh
  Expected: [{"tables": 5, "policies": 14, "buckets": 1, "trigger": 1}]

Add new migration:
  cat > db/migrations/006_xxx.sql << 'EOF'
  create table public.exams (...);
  EOF
  bash db/migrate.sh

API endpoint: POST https://api.supabase.com/v1/projects/{ref}/database/query

---

## 🎯 Phase Status

Phase 1 — UI/UX ✅
- Landing, dashboard mockups, theme, dark mode, mobile nav

Phase 2 — Auth + Multi-Tenant ✅
- Supabase Auth, RLS, 5 tables, storage, institution creation
- Premium type system (47) + board system (60+) + BD locations (64)

Phase 3 — Institution Dashboard ⏳ NEXT
- Real student/teacher management
- Class/batch CRUD
- Invite system
- Attendance tracking

Phase 4 — Examination (planned)
Phase 5 — Finance (planned)
Phase 6 — AI Tutor (planned)
Phase 7 — White-Label (planned)

---

## 🔑 Token Management

- NEVER paste tokens in chat or commit to git
- Rotate at: https://supabase.com/dashboard/account/tokens
- If leaked: revoke immediately + generate new
- Safe input method:
  read -rsp "Token: " T && printf '%s' "$T" > ~/.skb-supabase-token && unset T

---

## 📝 Response Style for AI Assistant

When helping with this project:
- Language: Bengali for explanations, English for code
- Termux commands: copy-paste ready blocks
- No nano editor: use cat > file << 'EOF' heredocs
- No browser clicks if avoidable: prefer ./db/sql.sh for DB ops
- CRITICAL: router.push without /skb-education-ecosystem prefix
- Small steps: 1-3 commands at a time, wait for result
- Celebrate progress: user is building this from zero

---

## 🚨 Recovery

If token lost:
1. https://supabase.com/dashboard/account/tokens → new token
2. read -rsp "Token: " T && printf '%s' "$T" > ~/.skb-supabase-token

If GitHub token lost:
1. https://github.com/settings/tokens → new (scope: repo)
2. Update ~/.git-credentials

---

Last Updated: 2026-10-16 (post-polish)
Current Phase: Phase 2 complete, Phase 3 starting
Founder: SKB Sakib (@skbsakib500)
