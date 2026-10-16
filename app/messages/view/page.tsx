"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useRealtimeMessages } from "@/lib/useRealtime";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><ChatView /></Suspense>;
}

function ChatView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const convId = searchParams.get("id");

  const [messages, setMessages] = useState<any[]>([]);
  const [other, setOther] = useState<any>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!convId || !user) return;
    const [msgRes, otherRes] = await Promise.all([
      supabase.from("messages").select("id, content, sender_id, created_at")
        .eq("conversation_id", convId).order("created_at", { ascending: true }).limit(200),
      supabase.from("conversation_members")
        .select("user_id, profiles:user_id(full_name, username, avatar_url)")
        .eq("conversation_id", convId).neq("user_id", user.id).maybeSingle(),
    ]);
    setMessages(msgRes.data ?? []);
    setOther(otherRes.data?.profiles);
    setLoading(false);
    await supabase.rpc("mark_conversation_read", { p_conv_id: convId });
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (user && convId) load();
  }, [user, convId, authLoading, router]);

  // Real-time subscription
  useRealtimeMessages(convId, async () => {
    if (convId) {
      const { data } = await supabase.from("messages").select("id, content, sender_id, created_at")
        .eq("conversation_id", convId).order("created_at", { ascending: true }).limit(200);
      setMessages(data ?? []);
    }
  });

  // Fallback poll every 30s
  useEffect(() => {
    if (!convId || !user) return;
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [convId, user]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim() || !convId) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: convId, sender_id: user.id, content: text.trim(),
    });
    setText("");
    setSending(false);
    await load();
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;

  const otherInit = (other?.full_name || "U").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/messages" className="text-[13px]" style={{ color: "var(--text-muted)" }}>←</Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold text-white"
            style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
            {other?.avatar_url ? <img src={other.avatar_url} alt="" className="h-full w-full object-cover rounded-full" /> : otherInit}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold truncate">{other?.full_name || "Conversation"}</div>
            {other?.username && <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>@{other.username}</div>}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: "calc(100vh - 140px)" }}>
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
                <div className={"max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] " + (mine ? "text-white" : "")}
                  style={mine
                    ? { background: "linear-gradient(135deg,#10b981,#14b8a6)" }
                    : { background: "var(--surface-3)", borderColor: "var(--border)", border: "1px solid var(--border)" }}>
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                  <div className={"text-[10px] mt-1 " + (mine ? "text-white/70" : "")}
                    style={!mine ? { color: "var(--text-faint)" } : {}}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={send} className="sticky bottom-0 border-t p-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto max-w-3xl flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border px-4 py-2.5 text-[14px] outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          <button type="submit" disabled={sending || !text.trim()}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow disabled:opacity-50">
            {sending ? "..." : "Send →"}
          </button>
        </div>
      </form>
    </main>
  );
}
