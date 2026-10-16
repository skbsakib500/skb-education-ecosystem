"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export default function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const [listRes, countRes] = await Promise.all([
      supabase.from("notifications")
        .select("id, title, body, category, link, is_read, created_at")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.rpc("my_unread_notifications"),
    ]);
    setItems(listRes.data ?? []);
    setUnread(countRes.data ?? 0);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_user_id", user.id).eq("is_read", false);
    await load();
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  const catMeta = (c: string) => ({
    general:    { emoji: "📌", color: "slate" },
    exam:       { emoji: "📝", color: "violet" },
    fee:        { emoji: "💵", color: "emerald" },
    attendance: { emoji: "✅", color: "teal" },
    notice:     { emoji: "📢", color: "amber" },
    result:     { emoji: "🎯", color: "emerald" },
    urgent:     { emoji: "🚨", color: "rose" },
  } as any)[c] ?? { emoji: "📌", color: "slate" };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        <span className="text-[15px]">🔔</span>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2"
            style={{ boxShadow: "0 0 0 2px var(--surface-3)" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-40 w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border shadow-2xl"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="text-[13px] font-semibold">Notifications</div>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-medium text-emerald-600">Mark all read</button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-[28px]">🔔</div>
                <div className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>No notifications yet</div>
              </div>
            ) : items.map((n) => {
              const m = catMeta(n.category);
              return (
                <button key={n.id}
                  onClick={() => { markRead(n.id); if (n.link) window.location.href = n.link; }}
                  className={"w-full text-left px-4 py-3 border-b hover:bg-[var(--bg-soft)] transition " + (n.is_read ? "" : "bg-emerald-500/5")}
                  style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start gap-3">
                    <div className="text-[18px]">{m.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className={"text-[13px] " + (n.is_read ? "font-medium" : "font-semibold")}>{n.title}</div>
                      {n.body && <div className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{n.body}</div>}
                      <div className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                    {!n.is_read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t px-4 py-2 text-center text-[11px]"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-faint)" }}>
            Last 20 notifications
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 7) return d + "d ago";
  return new Date(iso).toLocaleDateString();
}
