-- SKB Demo Seed Data
-- Password for ALL demo users: Demo@123456
-- Idempotent: uses fixed UUIDs + ON CONFLICT DO NOTHING
-- Safe: can re-run any time

-- ═══════════════════════════════════════════════════════════════
-- 1. DEMO USER ACCOUNTS (auth.users)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change
) VALUES
  -- Admin / Institution Owner
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'demo.admin@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Md. Sakib Al Mhamud"}'::jsonb,
   now(), now(), '', '', '', ''),
  -- Teachers
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'demo.rahman@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Md. Abdur Rahman"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'demo.fatema@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Fatema Begum"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'demo.karim@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Abdul Karim"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'demo.shirin@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Shirin Sultana"}'::jsonb,
   now(), now(), '', '', '', ''),
  -- Students
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
   'demo.sakib@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Sakib Hasan"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
   'demo.ayesha@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Ayesha Siddiqua"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
   'demo.tanvir@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Tanvir Ahmed"}'::jsonb,
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000009', 'authenticated', 'authenticated',
   'demo.nusrat@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Nusrat Jahan"}'::jsonb,
   now(), now(), '', '', '', ''),
  -- Parent
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000010', 'authenticated', 'authenticated',
   'demo.parent@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Md. Kamal Hossain"}'::jsonb,
   now(), now(), '', '', '', ''),
  -- Tutor
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-0000-0000-000000000011', 'authenticated', 'authenticated',
   'demo.tutor@skb.local', crypt('Demo@123456', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rifat Hossain"}'::jsonb,
   now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 2. PROFILES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO profiles (id, email, full_name, username, headline, bio, primary_role, sub_role, location, expertise, interests, open_to, onboarding_complete, avatar_url) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'demo.admin@skb.local', 'Md. Sakib Al Mhamud', 'sakib_admin', 'Founder · Dhaka Ideal School', 'শিক্ষা প্রযুক্তিতে ১০ বছরের অভিজ্ঞতা। বাংলাদেশের সব শিক্ষার্থীকে এক প্ল্যাটফর্মে আনার স্বপ্ন নিয়ে কাজ করছি।', 'owner', 'principal', 'Dhaka, Bangladesh', '["Education","Management","Technology"]'::jsonb, '["EdTech","Startups","Teaching"]'::jsonb, '["collaboration","mentoring"]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'demo.rahman@skb.local', 'Md. Abdur Rahman', 'rahman_math', 'Senior Math Teacher · 12 years', 'গণিত সহজ। শুধু সঠিকভাবে বুঝতে হবে। Class 8-12 এবং HSC preparation-এ বিশেষজ্ঞ।', 'teacher', 'senior_teacher', 'Dhaka, Bangladesh', '["Mathematics","Algebra","Geometry"]'::jsonb, '["Teaching","Problem Solving"]'::jsonb, '["tutoring","mentoring"]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'demo.fatema@skb.local', 'Fatema Begum', 'fatema_english', 'English Teacher · IELTS Expert', 'Communicative English-এ ৮ বছরের অভিজ্ঞতা। IELTS 7.5 + Spoken English কোর্স।', 'teacher', 'lecturer', 'Dhaka, Bangladesh', '["English","Grammar","IELTS"]'::jsonb, '["Literature","Travel","Photography"]'::jsonb, '["tutoring","freelance"]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'demo.karim@skb.local', 'Abdul Karim', 'karim_physics', 'Physics Lecturer · BUET Graduate', 'পদার্থবিজ্ঞান মুখস্থ করার বিষয় না — বোঝার বিষয়। BUET CSE থেকে graduation।', 'teacher', 'lecturer', 'Dhaka, Bangladesh', '["Physics","Mechanics","Waves"]'::jsonb, '["Astronomy","Gaming"]'::jsonb, '["tutoring"]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'demo.shirin@skb.local', 'Shirin Sultana', 'shirin_chem', 'Chemistry Teacher · HSC Specialist', 'রসায়ন আমার passion। HSC + Admission preparation-এ ৬ বছর।', 'teacher', 'senior_teacher', 'Chittagong, Bangladesh', '["Chemistry","Organic Chemistry"]'::jsonb, '["Research","Reading"]'::jsonb, '["tutoring"]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'demo.sakib@skb.local', 'Sakib Hasan', 'sakib_h', 'Class 10 Student · Science', 'পদার্থবিজ্ঞান আর গণিত ভালো লাগে। ভবিষ্যতে engineer হতে চাই।', 'student', 'student', 'Dhaka, Bangladesh', '[]'::jsonb, '["Physics","Math","Programming"]'::jsonb, '[]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'demo.ayesha@skb.local', 'Ayesha Siddiqua', 'ayesha_s', 'Class 10 Student · Science', 'বই পড়তে ভালোবাসি। ডাক্তার হতে চাই।', 'student', 'student', 'Dhaka, Bangladesh', '[]'::jsonb, '["Biology","Chemistry","English"]'::jsonb, '[]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'demo.tanvir@skb.local', 'Tanvir Ahmed', 'tanvir_a', 'HSC 1st Year · Science', 'ICT আর Math-এ আগ্রহ বেশি।', 'student', 'student', 'Chittagong, Bangladesh', '[]'::jsonb, '["ICT","Math"]'::jsonb, '[]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'demo.nusrat@skb.local', 'Nusrat Jahan', 'nusrat_j', 'Class 10 Student · Science', 'রসায়ন আর জীববিজ্ঞান আমার প্রিয়।', 'student', 'student', 'Dhaka, Bangladesh', '[]'::jsonb, '["Biology","Chemistry"]'::jsonb, '[]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'demo.parent@skb.local', 'Md. Kamal Hossain', 'kamal_parent', 'Parent of Sakib Hasan', 'আমার ছেলে Class 10-এ পড়ে। তার শিক্ষার অগ্রগতি দেখতে চাই।', 'parent', 'parent', 'Dhaka, Bangladesh', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, true, null),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'demo.tutor@skb.local', 'Rifat Hossain', 'rifat_tutor', 'Home Tutor · Math & Physics', 'BUET student. Class 6-12 Math/Physics home tutor. Online + Offline.', 'independent', 'tutor', 'Dhaka, Bangladesh', '["Mathematics","Physics"]'::jsonb, '["Teaching","Tech"]'::jsonb, '["tutoring"]'::jsonb, true, null)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 3. INSTITUTIONS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO institutions (id, name, slug, type, status, owner_email, emoji, division, city, education_board, contact_email, contact_phone, description, motto, established_year) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Dhaka Ideal School', 'dhaka-ideal-school', 'high_school', 'active', 'demo.admin@skb.local', '🏫', 'dhaka', 'dhaka', 'dhaka', 'info@dhakaideal.edu.bd', '+880 1700-000001', 'ঢাকার একটি শীর্ষস্থানীয় মাধ্যমিক বিদ্যালয়। Class 6-10, Science + Commerce + Arts বিভাগ।', 'শিক্ষাই আলো', 1995),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Chittagong Coaching Center', 'ctg-coaching', 'coaching', 'active', 'demo.admin@skb.local', '📚', 'chittagong', 'chittagong', 'chittagong', 'info@ctgcoaching.edu.bd', '+880 1700-000002', 'HSC + Admission coaching-এর জন্য চট্টগ্রামের সেরা প্রতিষ্ঠান।', 'সাফল্যের পথে', 2010),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Rajshahi Model College', 'rajshahi-model-college', 'college', 'active', 'demo.admin@skb.local', '🎓', 'rajshahi', 'rajshahi', 'rajshahi', 'info@rmc.edu.bd', '+880 1700-000003', 'HSC + Degree কলেজ, রাজশাহী। Science + Arts + Commerce।', 'জ্ঞানের আলোয়', 1985)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 4. MEMBERSHIPS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO memberships (id, institution_id, user_id, role, status) VALUES
  -- Dhaka Ideal School
  ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'admin', 'active'),
  ('cccccccc-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'teacher', 'active'),
  ('cccccccc-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000003', 'teacher', 'active'),
  ('cccccccc-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000004', 'teacher', 'active'),
  ('cccccccc-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000006', 'student', 'active'),
  ('cccccccc-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000007', 'student', 'active'),
  ('cccccccc-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000009', 'student', 'active'),
  -- Chittagong Coaching
  ('cccccccc-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000005', 'teacher', 'active'),
  ('cccccccc-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000008', 'student', 'active'),
  -- Rajshahi Model College
  ('cccccccc-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000004', 'teacher', 'active')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 5. SOCIAL POSTS (মিশ্রিত বাংলা + English)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO social_posts (id, user_id, content, post_type, visibility, institution_id, tags, likes_count, comments_count, created_at) VALUES
  ('dddddddd-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002',
   '📐 আজকের Class 10 Math: Pythagorean theorem-এর real-life application। ছাত্রছাত্রীদের বললাম — বাড়ি থেকে স্কুলের shortest distance বের করো। সবাই মুগ্ধ! 🎯',
   'text', 'public', 'bbbbbbbb-0000-0000-0000-000000000001',
   '["Math","Class10","Education"]'::jsonb, 12, 3, now() - interval '2 hours'),
  ('dddddddd-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000006',
   'আজ math exam দিলাম। Abdur Rahman sir-এর suggestion মেনে practice করেছিলাম — সব প্রশ্ন পারেনি! 😎💪',
   'text', 'public', 'bbbbbbbb-0000-0000-0000-000000000001',
   '["Math","Exam","Class10"]'::jsonb, 25, 8, now() - interval '5 hours'),
  ('dddddddd-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003',
   '🌍 IELTS Speaking Tip: Fluency > Perfect Grammar। প্রতিদিন ১০ মিনিট নিজের সাথে ইংরেজিতে কথা বলুন। ভুল হবে — কিন্তু pause নেবেন না! 🗣️',
   'text', 'public', null,
   '["English","IELTS","Tips"]'::jsonb, 45, 12, now() - interval '1 day'),
  ('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000004',
   '⚛️ Physics-এ সবচেয়ে বড় ভুল: formula মুখস্থ করা। আসলে formula-টা কোথা থেকে এলো সেটা জানা জরুরি। এইটা বোঝা গেলে আর কোন প্রশ্ন কঠিন না। 🧠',
   'text', 'public', 'bbbbbbbb-0000-0000-0000-000000000003',
   '["Physics","Learning","Tips"]'::jsonb, 67, 15, now() - interval '2 days'),
  ('dddddddd-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000007',
   '📚 বই পড়ার নতুন অভ্যাস: প্রতিদিন রাতে ঘুমানোর আগে ৩০ মিনিট বাংলা সাহিত্য। "পথের পাঁচালী" শেষ! পরেরটা কোনটা পড়বো? 📖',
   'text', 'public', 'bbbbbbbb-0000-0000-0000-000000000001',
   '["Books","Bangla","Reading"]'::jsonb, 34, 20, now() - interval '3 days'),
  ('dddddddd-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000011',
   '🎓 Class 6-12 Math/Physics home tutor available. BUET CSE student. Online + Offline (Dhaka). Rate: 3000-5000 BDT/month.',
   'text', 'public', null,
   '["Tutoring","Math","Physics"]'::jsonb, 18, 6, now() - interval '4 days'),
  ('dddddddd-0000-0000-0000-000000000007', 'aaaaaaaa-0000-0000-0000-000000000005',
   '🧪 Chemistry lab-এ আজকের practical: Acid-base titration। ছাত্রছাত্রীদের excited face দেখলে মনে হয় — সঠিক পথে আছি। ❤️',
   'text', 'public', 'bbbbbbbb-0000-0000-0000-000000000002',
   '["Chemistry","Lab","Teaching"]'::jsonb, 29, 7, now() - interval '5 days'),
  ('dddddddd-0000-0000-0000-000000000008', 'aaaaaaaa-0000-0000-0000-000000000008',
   '💻 ICT-তে নতুন কিছু শিখলাম: Python দিয়ে simple calculator বানালাম। প্রথম code, অনেক excite করছি! 🎉',
   'text', 'public', null,
   '["ICT","Programming","Python"]'::jsonb, 41, 11, now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 6. DISCUSSIONS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO discussions (id, author_id, title, body, topic, tags, upvotes, answers_count, views, created_at) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000006',
   'Newton''s 3rd Law - বাংলায় সহজভাবে বুঝতে চাই',
   'আমি জানি Newton''s 3rd law বলছে "প্রত্যেক ক্রিয়ার সমান ও বিপরীত প্রতিক্রিয়া আছে"। কিন্তু বাস্তব উদাহরণ দিয়ে বুঝতে পারছি না। কেউ কি সহজ উদাহরণ দিতে পারবেন?',
   'Physics', '["Newton","Physics","Class10"]'::jsonb, 18, 5, 234, now() - interval '1 day'),
  ('eeeeeeee-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000007',
   'HSC English 1st Paper - কোন বই সবচেয়ে ভালো?',
   'HSC 2026-এর জন্য English 1st Paper-এ ভালো guide book suggest করুন। Market-এ অনেক option, confused!',
   'English', '["HSC","English","Books"]'::jsonb, 22, 8, 456, now() - interval '2 days'),
  ('eeeeeeee-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000009',
   'Chemistry-তে Organic আর Inorganic-এর মধ্যে পার্থক্য কী?',
   'আমি Class 10-এ পড়ি। Organic chemistry আর Inorganic chemistry-এর basic difference জানতে চাই। সহজ ভাষায় বলবেন?',
   'Chemistry', '["Chemistry","Organic","Class10"]'::jsonb, 15, 6, 189, now() - interval '3 days'),
  ('eeeeeeee-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000008',
   'ICT - Programming শেখা শুরু করবো কীভাবে?',
   'আমি HSC 1st year, ICT subject-এ programming basics শিখতে চাই। Python, C, নাকি Java দিয়ে শুরু করবো? কী suggest করবেন?',
   'ICT', '["ICT","Programming","HSC"]'::jsonb, 31, 12, 512, now() - interval '4 days'),
  ('eeeeeeee-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002',
   'Math-এ practice-এর সেরা উপায় কী?',
   'শিক্ষক হিসেবে জিজ্ঞেস করছি — ছাত্রছাত্রীরা কীভাবে math practice করলে সবচেয়ে দ্রুত improve করে? আপনার অভিজ্ঞতা শেয়ার করুন।',
   'Mathematics', '["Math","Practice","Learning"]'::jsonb, 42, 18, 823, now() - interval '5 days'),
  ('eeeeeeee-0000-0000-0000-000000000006', 'aaaaaaaa-0000-0000-0000-000000000010',
   'সন্তানের পড়াশোনায় অভিভাবক হিসেবে কীভাবে সাহায্য করবো?',
   'আমার ছেলে Class 10-এ পড়ে। আমি চাকরি করি, সন্ধ্যায় বাড়ি ফিরি। কীভাবে ওর পড়াশোনায় সাহায্য করতে পারি?',
   'Parenting', '["Parenting","Study","Tips"]'::jsonb, 56, 22, 1240, now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 7. STUDY MATERIALS
-- ═══════════════════════════════════════════════════════════════
INSERT INTO study_materials (id, uploader_id, institution_id, subject, title, description, type, external_url, tags, downloads, views, is_public, created_at) VALUES
  ('ffffffff-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001',
   'Mathematics', 'Class 10 Math - Chapter 1-5 Notes (Bangla)', 'Complete notes for Class 10 Math Chapters 1-5 in easy Bangla. Includes solved examples.', 'note', 'https://example.com/math-notes.pdf',
   '["Math","Class10","Bangla"]'::jsonb, 145, 892, true, now() - interval '3 days'),
  ('ffffffff-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000003',
   'Physics', 'HSC Physics Formula Sheet - All Chapters', 'Complete physics formula reference for HSC 1st & 2nd paper. Printable PDF.', 'pdf', 'https://example.com/physics-formulas.pdf',
   '["Physics","HSC","Formulas"]'::jsonb, 312, 1567, true, now() - interval '5 days'),
  ('ffffffff-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000003', null,
   'English', 'IELTS Speaking Practice Questions (50 Topics)', '50 common IELTS speaking questions with sample answers and vocabulary.', 'pdf', 'https://example.com/ielts-speaking.pdf',
   '["English","IELTS","Speaking"]'::jsonb, 89, 423, true, now() - interval '1 week'),
  ('ffffffff-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000002',
   'Chemistry', 'Chemistry Practical Lab Manual - HSC', 'All HSC chemistry practicals with step-by-step procedure and observations.', 'pdf', 'https://example.com/chem-lab.pdf',
   '["Chemistry","HSC","Practical"]'::jsonb, 67, 234, true, now() - interval '10 days'),
  ('ffffffff-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000011', null,
   'Mathematics', 'BUET Admission Math - Year-wise Questions (2010-2025)', 'BUET admission test Math questions organized by year with detailed solutions.', 'pdf', 'https://example.com/buet-math.pdf',
   '["Math","BUET","Admission"]'::jsonb, 456, 2891, true, now() - interval '2 weeks')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 8. TUTOR PROFILES
-- ═══════════════════════════════════════════════════════════════
INSERT INTO tutor_profiles (user_id, headline, bio, subjects, levels, languages, hourly_rate_bdt, negotiable, mode, division, city, experience_years, education, is_active, rating_avg, rating_count) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000011', 'Home Tutor · Math & Physics · BUET',
   'BUET CSE student. 3 years experience. Class 6-12 Math & Physics. Concept-based teaching, not memorization.',
   '["Mathematics","Physics"]'::jsonb, '["Class 6-8","Class 9-10","HSC"]'::jsonb, '["Bangla","English"]'::jsonb,
   4000, true, 'both', 'Dhaka', 'Dhaka', 3, 'BUET CSE (Undergrad)', true, 4.8, 24),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Senior Math Teacher · 12 years experience',
   'Class 8-12 Math expert. Algebra, Geometry, Trigonometry. Exam-focused teaching.',
   '["Mathematics","Algebra","Geometry"]'::jsonb, '["Class 8","Class 9-10","HSC"]'::jsonb, '["Bangla","English"]'::jsonb,
   5000, false, 'offline', 'Dhaka', 'Dhaka', 12, 'MSc Mathematics, DU', true, 4.9, 87),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'English Teacher · IELTS 7.5 · Spoken Expert',
   'Communicative English + IELTS preparation. 8 years experience. Interactive classes.',
   '["English","IELTS","Spoken English"]'::jsonb, '["Class 6-10","HSC","Adult"]'::jsonb, '["Bangla","English"]'::jsonb,
   3500, true, 'both', 'Dhaka', 'Dhaka', 8, 'MA English, DU', true, 4.7, 45)
ON CONFLICT (user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 9. GAMIFICATION (points + badges)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO user_gamification (user_id, total_points, current_streak, longest_streak, level, last_active_date) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 850, 12, 25, 5, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000002', 1240, 8, 30, 7, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000003', 980, 15, 20, 6, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000004', 1560, 20, 45, 8, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000005', 620, 6, 15, 4, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000006', 420, 5, 12, 3, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000007', 380, 4, 10, 3, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000008', 290, 3, 8, 2, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000009', 510, 7, 14, 4, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000010', 180, 2, 5, 2, current_date),
  ('aaaaaaaa-0000-0000-0000-000000000011', 720, 10, 18, 5, current_date)
ON CONFLICT (user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 10. PARENT-STUDENT LINK (Kamal → Sakib)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO parent_student_links (id, parent_user_id, student_id, institution_id, relationship) VALUES
  ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000001', 'father')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 11. VERIFICATION (fatema = verified teacher by admin)
-- ═══════════════════════════════════════════════════════════════
INSERT INTO verification_records (id, subject_type, subject_id, verification_type, issuer_id, status, verified_at) VALUES
  ('22222222-0000-0000-0000-000000000001', 'institution', 'aaaaaaaa-0000-0000-0000-000000000002', 'institution', 'aaaaaaaa-0000-0000-0000-000000000001', 'verified', now() - interval '5 days'),
  ('22222222-0000-0000-0000-000000000002', 'institution', 'aaaaaaaa-0000-0000-0000-000000000003', 'institution', 'aaaaaaaa-0000-0000-0000-000000000001', 'verified', now() - interval '5 days'),
  ('22222222-0000-0000-0000-000000000003', 'institution', 'aaaaaaaa-0000-0000-0000-000000000004', 'institution', 'aaaaaaaa-0000-0000-0000-000000000001', 'verified', now() - interval '3 days')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════
SELECT 'Seed complete' AS status;
