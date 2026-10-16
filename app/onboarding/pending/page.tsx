"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><PendingView /></Suspense>;
}

function PendingView() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "join";

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("my_pending_requests");
      setRequests(data ?? []);
      setLoading(false);
    })();

    const interval = setInterval(async () => {
      const { data } = await supabase.rpc("my_pending_requests");
      const list = data ?? [];
      if (list.length === 0) {
        // All approved — go to hub
        const { data: profile } = await supabase.from("profiles").select("onboarding_complete").eq("id", user.id).maybeSingle();
        if (profile?.onboarding_complete) router.push("/hub/");
      }
      setRequests(list);
    }, 10000);
    return () => clearInterval(interval);
  }, [user, router]);

  const messages: any = {
    owner: { title: "Institution Request Submitted", bn: "প্রতিষ্ঠান অনুমোদনের অপেক্ষায়", emoji: "🏛️", note: "SKB Super Admin যাচাই করে অনুমোদন দেবেন (সাধারণত ২৪ ঘণ্টা)। অনুমোদন হলে email/push notification পাবেন।" },
    teacher: { title: "Teacher Join Request Sent", bn: "শিক্ষক হিসেবে যুক্ত হওয়ার request পাঠানো হয়েছে", emoji: "👨‍🏫", note: "প্রতিষ্ঠান admin approve করলে active হবেন।" },
    student: { title: "Student Join Request Sent", bn: "শিক্ষার্থী হিসেবে যুক্ত হওয়ার request পাঠানো হয়েছে", emoji: "🎓", note: "প্রতিষ্ঠান admin approve করলে class, exam, result সব পাবেন।" },
    parent: { title: "Parent Link Request Sent", bn: "সন্তানের সাথে link হওয়ার request পাঠানো হয়েছে", emoji: "👪", note: "Admin approve করলে সন্তানের সব তথ্য দেখতে পাবেন।" },
    staff: { title: "Staff Join Request Sent", bn: "কর্মী হিসেবে যুক্ত হওয়ার request পাঠানো হয়েছে", emoji: "💼", note: "Admin approve করলে আপনার role-specific dashboard পাবেন।" },
  };
  const m = messages[type] || messages.teacher;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[64px] animate-pulse">{m.emoji}</div>
          <h1 className="mt-4 text-[22px] font-semibold">{m.title}</h1>
          <div className="bangla text-[14px] mt-1" style={{ color: "var(--text-muted)" }}>{m.bn}</div>

          <div className="mt-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-left text-[13px] text-amber-800">
            <div className="font-semibold mb-1">⏳ অনুমোদনের অপেক্ষায়</div>
            <div className="bangla leading-relaxed">{m.note}</div>
          </div>

          {!loading && requests.length > 0 && (
            <div className="mt-6 text-left">
              <div className="text-[12px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                আপনার Pending Requests
              </div>
              <div className="space-y-2">
                {requests.map((r, i) => (
                  <div key={i} className="rounded-xl border p-3 flex items-center justify-between"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold truncate">{r.institution_name}</div>
                      <div className="text-[11px] capitalize" style={{ color: "var(--text-muted)" }}>
                        {r.request_type} · {r.role_or_status}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <Link href="/hub" className="rounded-full border px-5 py-2.5 text-[13px]"
              style={{ borderColor: "var(--border)" }}>🏠 Go to Hub</Link>
            <button onClick={async () => { await signOut(); router.push("/login/"); }}
              className="text-[12px]" style={{ color: "var(--text-faint)" }}>Sign out</button>
          </div>

          <div className="mt-6 text-[11px]" style={{ color: "var(--text-faint)" }}>
            💡 পেজটি auto-refresh হয় প্রতি ১০ সেকেন্ডে
          </div>
        </div>
      </div>
    </main>
  );
}
