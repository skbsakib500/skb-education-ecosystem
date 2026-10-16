"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function Page() {
  return <Suspense fallback={<Loading />}><JoinView /></Suspense>;
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

function JoinView() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading"|"not_logged_in"|"accepting"|"success"|"error">("loading");
  const [error, setError] = useState("");
  const [inviteInfo, setInviteInfo] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!token) { setStatus("error"); setError("No invitation token"); return; }

    if (!user) { setStatus("not_logged_in"); return; }

    (async () => {
      setStatus("accepting");
      const { data, error } = await supabase.rpc("accept_invitation", { p_token: token });

      if (error) {
        setStatus("error");
        setError(error.message);
        return;
      }

      setInviteInfo(data);
      setStatus("success");
      setTimeout(() => router.push("/hub/"), 2500);
    })();
  }, [user, authLoading, token, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border shadow-xl p-8"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            SKB
          </div>
          <div>
            <div className="text-[16px] font-semibold">Join Institution</div>
            <div className="bangla text-[12px]" style={{ color: "var(--text-muted)" }}>
              প্রতিষ্ঠানে যোগ দিন
            </div>
          </div>
        </div>

        <div className="mt-6">
          {status === "loading" || status === "accepting" ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              <div className="mt-3 text-[13px]" style={{ color: "var(--text-muted)" }}>
                {status === "accepting" ? "অ্যাক্সেপ্ট করা হচ্ছে..." : "লোড হচ্ছে..."}
              </div>
            </div>
          ) : status === "not_logged_in" ? (
            <div>
              <div className="rounded-xl bg-amber-500/10 p-3 text-[13px] text-amber-700 mb-4">
                ⚠️ Invitation accept করতে প্রথমে login বা signup করুন
              </div>
              <div className="flex flex-col gap-2">
                <Link href={"/login/?next=/join/?token=" + token}
                  className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-center text-[14px] font-semibold text-white shadow-lg">
                  Sign in
                </Link>
                <Link href={"/signup/?next=/join/?token=" + token}
                  className="w-full rounded-xl border py-3 text-center text-[14px] font-medium"
                  style={{ borderColor: "var(--border)" }}>
                  Create account
                </Link>
              </div>
            </div>
          ) : status === "success" ? (
            <div className="text-center py-6">
              <div className="text-[48px]">✅</div>
              <div className="mt-3 text-[16px] font-semibold">Welcome!</div>
              <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
                সফলভাবে যোগ হয়েছেন
              </div>
              {inviteInfo?.already_member && (
                <div className="mt-2 text-[12px]" style={{ color: "var(--text-faint)" }}>
                  (Already a member)
                </div>
              )}
              <div className="mt-4 text-[12px]" style={{ color: "var(--text-faint)" }}>
                Dashboard-এ redirect হচ্ছে...
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-[48px]">❌</div>
              <div className="mt-3 text-[16px] font-semibold">Invitation Failed</div>
              <div className="bangla text-[13px] mt-2 text-rose-600">{error}</div>
              <div className="mt-4 rounded-xl p-3 text-[12px]"
                style={{ background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                সম্ভাব্য কারণ:
                <ul className="list-disc ml-4 mt-1 text-left">
                  <li>Invitation expired (৭ দিন)</li>
                  <li>Token ভুল</li>
                  <li>অন্য email দিয়ে login করা</li>
                  <li>Invitation cancel করা হয়েছে</li>
                </ul>
              </div>
              <Link href="/dashboard/" className="mt-4 inline-block rounded-full border px-5 py-2 text-[13px]"
                style={{ borderColor: "var(--border)" }}>
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
