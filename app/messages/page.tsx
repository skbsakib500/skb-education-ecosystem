"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function InboxPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [convos, setConvos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("my_conversations");
    setConvos(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user) load();
  }, [user, authLoading, router]);

  // Auto-refresh every 15s
  useEffect(() => {
    const t = setInterval(() => { if (user) load(); }, 15000);
    return () => clearInterval(t);
  }, [user]);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return m + "m";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h";
    return Math.floor(h / 24) + "d";
  };

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/hub" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[14px] shadow-lg">💬</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">Messages</div>
              <div className="bangla text-fluid-micro" style={{ color: "var(--text-muted)" }}>বার্তা</div>
            </div>
          </Link>
          <button onClick={signOut} className="rounded-full border px-3 py-1.5 text-fluid-caption" style={{ borderColor: "var(--border)" }}>Sign out</button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {loading ? (
          <div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : convos.length === 0 ? (
          <div className="rounded-2xl border p-12 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
            <div className="text-[48px]">💬</div>
            <div className="mt-3 text-[15px] font-semibold">No messages yet</div>
            <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
              কোনো conversation নেই
            </div>
            <div className="mt-4 text-fluid-caption" style={{ color: "var(--text-faint)" }}>
              Explore tab → যেকোনো user-এর profile → "Message" button
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {convos.map((c) => {
              const initials = (c.other_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
              return (
                <Link key={c.conversation_id} href={"/messages/view/?id=" + c.conversation_id}
                  className="flex items-center gap-3 rounded-2xl border p-3 transition hover:bg-[var(--bg-soft)]"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full text-[14px] font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                    {c.other_avatar ? <img src={c.other_avatar} alt="" className="h-full w-full object-cover rounded-full" /> : initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold truncate">{c.other_name || c.name || "Conversation"}</span>
                      {c.unread_count > 0 && (
                        <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="text-fluid-caption truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {c.last_message || "No messages"}
                    </div>
                  </div>
                  <div className="text-fluid-micro shrink-0" style={{ color: "var(--text-faint)" }}>
                    {c.last_message_at ? timeAgo(c.last_message_at) : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
