"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function PersonalSpace() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setProfile(data);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const interests = profile?.interests || [];
  const firstName = (profile?.full_name || user?.email || "User").split(/[\s@]/)[0];

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-8">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white text-[14px] font-bold shadow-lg">🎯</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Personal Space</div>
              <div className="bangla text-[11px]" style={{ color: "var(--text-muted)" }}>ব্যক্তিগত শেখার জায়গা</div>
            </div>
          </Link>
          <button onClick={signOut} className="rounded-full border px-3.5 py-1.5 text-[12px]" style={{ borderColor: "var(--border)" }}>Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 md:px-8 pt-8">
        <div className="rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-20 h-[220px] w-[220px] rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Independent Mode
            </div>
            <h1 className="mt-4 text-[26px] md:text-[32px] font-semibold">স্বাগতম, {firstName}!</h1>
            <p className="mt-2 text-[14px] text-white/90 max-w-2xl">
              আপনার ব্যক্তিগত শেখার জায়গা। প্রতিষ্ঠান ছাড়াই পড়ুন, প্র্যাকটিস করুন, নিজের অগ্রগতি দেখুন।
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[13px] font-semibold mb-3">🎯 আপনার আগ্রহ</div>
          {interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interests.map((s: string) => (
                <span key={s} className="rounded-full bg-rose-500/15 px-3 py-1.5 text-[12px] font-medium text-rose-700">{s}</span>
              ))}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: "var(--text-muted)" }}>কোনো আগ্রহ যোগ করা হয়নি</div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FeatureCard icon="📝" title="Self Practice" bn="নিজে প্র্যাকটিস" desc="MCQ practice — নিজের জন্য" />
          <FeatureCard icon="📚" title="Notes & Materials" bn="নোট ও সামগ্রী" desc="নিজের পড়ার সামগ্রী" />
          <FeatureCard icon="📊" title="My Progress" bn="আমার অগ্রগতি" desc="Self-tracked analytics" />
        </div>

        <div className="mt-6 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[14px] font-semibold">🔗 প্রতিষ্ঠানে যুক্ত হতে চান?</div>
          <div className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
            যেকোনো সময় প্রতিষ্ঠানে join করার request পাঠাতে পারবেন — personal data নিরাপদ থাকবে।
          </div>
          <Link href="/onboarding/student/" className="mt-3 inline-block rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white shadow">
            Join Institution →
          </Link>
        </div>

        <div className="mt-10 text-center text-[11px]" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem · Personal Space
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, bn, desc }: any) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[24px]">{icon}</div>
      <div className="mt-2 text-[14px] font-semibold">{title}</div>
      <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>{bn}</div>
      <div className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>{desc}</div>
    </div>
  );
}
