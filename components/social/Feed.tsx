"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import PostComposer from "./PostComposer";
import PostCard from "./PostCard";

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("get_feed", { p_limit: 30, p_offset: 0 });
    setPosts(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PostComposer onPosted={load} />

      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="text-[48px]">📝</div>
          <div className="mt-3 text-[15px] font-semibold">আপনার feed খালি</div>
          <div className="bangla text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            অনুসরণ করুন অন্যদের, প্রথম post করুন
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => <PostCard key={p.id} post={p} onChange={load} />)}
        </div>
      )}
    </div>
  );
}
