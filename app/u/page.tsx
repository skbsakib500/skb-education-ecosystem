"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import PostCard from "@/components/social/PostCard";

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}><ProfileView /></Suspense>;
}

function ProfileView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login/"); return; }
    if (!username) { router.push("/feed/"); return; }

    (async () => {
      const { data } = await supabase.rpc("get_public_profile", { p_username: username });
      if (!data) { router.push("/feed/"); return; }
      setData(data);
      setFollowing(data.is_following || false);
      setLoading(false);
    })();
  }, [username, user, authLoading, router]);

  const toggleFollow = async () => {
    if (!user || !data || data.is_me) return;
    if (following) {
      await supabase.from("social_follows").delete().eq("follower_id", user.id).eq("following_id", data.profile.id);
      setFollowing(false);
    } else {
      await supabase.from("social_follows").insert({ follower_id: user.id, following_id: data.profile.id });
      setFollowing(true);
    }
  };

  if (authLoading || loading || !data) {
    return <div className="min-h-screen flex items-center justify-center"><div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  const p = data.profile;
  const initials = (p.full_name || "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b"
        style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/feed" className="text-[13px]" style={{ color: "var(--text-muted)" }}>← Feed</Link>
          <div className="text-[13px] font-semibold">@{p.username}</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Cover + Avatar */}
        <div className="rounded-3xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="h-32 md:h-40" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6,#06b6d4)" }} />
          <div className="px-5 pb-5">
            <div className="-mt-14 flex items-end justify-between gap-3 flex-wrap">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl text-[36px] font-bold text-white border-4 shadow-lg"
                style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)", borderColor: "var(--surface-3)" }}>
                {p.avatar_url ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" /> : initials}
              </div>
              {data.is_me ? (
                <Link href="/profile"
                  className="rounded-full border px-5 py-2 text-[13px] font-medium"
                  style={{ borderColor: "var(--border)" }}>
                  ✏️ Edit Profile
                </Link>
              ) : (
                <div className="flex gap-2">
                  <button onClick={toggleFollow}
                    className={"rounded-full px-5 py-2 text-[13px] font-semibold shadow " + (following ? "border" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white")}
                    style={following ? { borderColor: "var(--border)" } : {}}>
                    {following ? "✓ Following" : "+ Follow"}
                  </button>
                  <button onClick={async () => {
                    const { data: cid } = await supabase.rpc("start_direct_conversation", { p_other_user_id: p.id });
                    if (cid) router.push("/messages/view/?id=" + cid);
                  }}
                    className="rounded-full border px-5 py-2 text-[13px] font-medium"
                    style={{ borderColor: "var(--border)" }}>
                    💬 Message
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="text-[22px] font-semibold">{p.full_name || "User"}</div>
              <div className="text-[13px]" style={{ color: "var(--text-muted)" }}>@{p.username}</div>
              {p.headline && <div className="mt-2 text-[14px]">{p.headline}</div>}
              {p.bio && <div className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{p.bio}</div>}

              <div className="flex flex-wrap gap-4 mt-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
                <span><strong className="text-[var(--text)]">{p.followers_count ?? 0}</strong> Followers</span>
                <span><strong className="text-[var(--text)]">{p.following_count ?? 0}</strong> Following</span>
                {p.location && <span>📍 {p.location}</span>}
              </div>

              {Array.isArray(p.expertise) && p.expertise.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Expertise</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.expertise.map((e: string) => (
                      <span key={e} className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(data.recent_institutions) && data.recent_institutions.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Institutions</div>
                  <div className="flex flex-wrap gap-2">
                    {data.recent_institutions.map((i: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                        style={{ borderColor: "var(--border)" }}>
                        <span>{i.emoji || "🏫"}</span>
                        <span className="text-[12px] font-medium">{i.name}</span>
                        <span className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>· {i.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="mt-6">
          <h2 className="text-[15px] font-semibold mb-3">Recent Posts</h2>
          {Array.isArray(data.posts) && data.posts.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[36px]">📝</div>
              <div className="mt-2 text-[13px]" style={{ color: "var(--text-muted)" }}>No posts yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              {data.posts.map((post: any) => (
                <PostCard key={post.id} post={{
                  ...post,
                  user_id: p.id,
                  author_name: p.full_name,
                  author_username: p.username,
                  author_avatar: p.avatar_url,
                  author_headline: p.headline,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
