"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, MessageSquare, UserPlus, Check, Pencil, ArrowLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import PostCard from "@/components/social/PostCard";

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProfileView />
    </Suspense>
  );
}

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

type PublicProfile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  headline?: string;
  bio?: string;
  location?: string;
  website?: string;
  expertise?: string[];
  interests?: string[];
  open_to?: string[];
  social_links?: Record<string, string>;
  primary_role?: string;
  sub_role?: string;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  is_me?: boolean;
  is_following?: boolean;
  locked?: boolean;
  recent_institutions?: { name: string; slug: string; emoji: string | null; role: string }[];
  posts?: any[];
  verification_badges?: { id: string; type: string; verified_at: string; issuer_id: string | null }[];
};

function ProfileView() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username");

  const [data, setData] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!username) { router.replace("/feed/"); return; }

    let cancelled = false;
    (async () => {
      const { data: profile, error } = await supabase.rpc("get_public_profile_v2", {
        p_slug: username,
      });

      if (cancelled) return;
      if (error || !profile) { router.replace("/feed/"); return; }

      setData(profile as PublicProfile);
      setFollowing(!!profile.is_following);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [username, authLoading, router]);

  const toggleFollow = async () => {
    if (!user || !data || data.is_me || data.locked) return;
    if (following) {
      await supabase.from("social_follows").delete()
        .eq("follower_id", user.id).eq("following_id", data.id);
      setFollowing(false);
      setData({ ...data, followers_count: Math.max(0, (data.followers_count || 0) - 1) });
    } else {
      await supabase.from("social_follows").insert({ follower_id: user.id, following_id: data.id });
      setFollowing(true);
      setData({ ...data, followers_count: (data.followers_count || 0) + 1 });
    }
  };

  const startMessage = async () => {
    if (!data) return;
    const { data: cid } = await supabase.rpc("start_direct_conversation", { p_other_user_id: data.id });
    if (cid) router.push("/messages/view/?id=" + cid);
  };

  if (authLoading || loading || !data) return <Spinner />;

  // ============ LOCKED PROFILE ============
  if (data.locked) {
    return (
      <main className="min-h-screen pb-16">
        <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
            <Link href="/feed/" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
              <ArrowLeft size={14} /> Feed
            </Link>
            <div className="text-sm font-semibold">@{data.username || "user"}</div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 pt-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <Lock size={24} />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-900">This profile is private</h1>
            <p className="mt-2 text-sm text-slate-500">
              @{data.username || "user"} প্রোফাইলটি কেবল অনুমোদিত ব্যক্তিরা দেখতে পারেন।
            </p>
            <Link href="/feed/" className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Explore public profiles
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initials = (data.full_name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const joinedYear = data.created_at ? new Date(data.created_at).getFullYear() : null;

  return (
    <main className="min-h-screen pb-16">
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--border)", background: "var(--surface)", backdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/feed/" className="inline-flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <ArrowLeft size={14} /> Feed
          </Link>
          <div className="text-sm font-semibold truncate">@{data.username || "user"}</div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6 space-y-6">
        {/* ============ Header card ============ */}
        <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
          <div className="h-32 md:h-40" style={{ background: "linear-gradient(135deg,#10b981,#14b8a6,#06b6d4)" }} />
          <div className="px-5 pb-5">
            <div className="-mt-14 flex items-end justify-between gap-3 flex-wrap">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl text-[36px] font-bold text-white border-4 shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600"
                style={{ borderColor: "white" }}>
                {data.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.avatar_url} alt="" className="h-full w-full object-cover rounded-2xl" />
                ) : initials}
              </div>

              {data.is_me ? (
                <Link href="/profile/" className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Pencil size={14} /> Edit Profile
                </Link>
              ) : (
                <div className="flex gap-2">
                  <button onClick={toggleFollow}
                    className={"inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow " + (following ? "border border-slate-300 text-slate-700 bg-white" : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white")}>
                    {following ? <><Check size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
                  </button>
                  <button onClick={startMessage}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    <MessageSquare size={14} /> Message
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900">{data.full_name || "User"}</h1>
                {Array.isArray(data.verification_badges) && data.verification_badges.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700" title="Verified">
                    <ShieldCheck size={13} /> Verified
                  </span>
                )}
              </div>
              {data.username && <div className="text-sm text-slate-500">@{data.username}</div>}
              {data.headline && <div className="mt-2 text-sm text-slate-700">{data.headline}</div>}
              {data.bio && <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{data.bio}</p>}

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                <span><strong className="text-slate-900">{data.followers_count ?? 0}</strong> Followers</span>
                <span><strong className="text-slate-900">{data.following_count ?? 0}</strong> Following</span>
                {data.location && <span>📍 {data.location}</span>}
                {data.website && (
                  <a href={data.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">🌐 {data.website.replace(/^https?:\/\//, "").slice(0, 30)}</a>
                )}
                {joinedYear && <span>📅 Joined {joinedYear}</span>}
              </div>

              {data.primary_role && (
                <div className="mt-4">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 capitalize">
                    {data.sub_role || data.primary_role}
                  </span>
                </div>
              )}

              {Array.isArray(data.expertise) && data.expertise.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Expertise</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.expertise.map((e) => (
                      <span key={e} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(data.interests) && data.interests.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Interests</div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.interests.map((e) => (
                      <span key={e} className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-700">{e}</span>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(data.recent_institutions) && data.recent_institutions.length > 0 && (
                <div className="mt-4">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Institutions</div>
                  <div className="flex flex-wrap gap-2">
                    {data.recent_institutions.map((i, idx) => (
                      <Link key={idx} href={`/institutions/view/?slug=${i.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                        <span>{i.emoji || "🏫"}</span>
                        <span>{i.name}</span>
                        <span className="text-slate-400 capitalize">· {i.role}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {data.social_links && Object.values(data.social_links).some(Boolean) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.social_links.facebook && <a href={data.social_links.facebook} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-600">Facebook</a>}
                  {data.social_links.linkedin && <a href={data.social_links.linkedin} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-600">LinkedIn</a>}
                  {data.social_links.twitter && <a href={data.social_links.twitter} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-600">Twitter</a>}
                  {data.social_links.instagram && <a href={data.social_links.instagram} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-600">Instagram</a>}
                  {data.social_links.youtube && <a href={data.social_links.youtube} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-emerald-600">YouTube</a>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============ Posts ============ */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Recent Posts</h2>
          {!Array.isArray(data.posts) || data.posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm text-slate-500">No public posts yet</div>
            </div>
          ) : (
            <div className="space-y-4">
              {data.posts.map((post) => (
                <PostCard key={post.id} post={{
                  ...post,
                  user_id: data.id,
                  author_name: data.full_name,
                  author_username: data.username,
                  author_avatar: data.avatar_url,
                  author_headline: data.headline,
                }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
