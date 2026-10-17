"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import ReportButton from "@/components/moderation/ReportButton";

interface Post {
  id: string;
  content: string;
  post_type: string;
  media_urls?: any;
  tags?: any;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  author_name?: string;
  author_username?: string;
  author_avatar?: string;
  author_headline?: string;
  institution_name?: string;
  institution_emoji?: string;
  is_liked?: boolean;
  is_following_author?: boolean;
}

const TYPE_META: Record<string, { label: string; emoji: string; color: string }> = {
  text:         { label: "Post",         emoji: "💬", color: "#10b981" },
  question:     { label: "Question",     emoji: "❓", color: "#8b5cf6" },
  announcement: { label: "Announcement", emoji: "📢", color: "#f59e0b" },
  journal:      { label: "Journal",      emoji: "📔", color: "#06b6d4" },
  achievement:  { label: "Achievement",  emoji: "🏆", color: "#f43f5e" },
  resource:     { label: "Resource",     emoji: "📚", color: "#14b8a6" },
};

export default function PostCard({ post, onChange }: { post: Post; onChange?: () => void }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  const meta = TYPE_META[post.post_type] ?? TYPE_META.text;
  const initials = (post.author_name ?? "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from("social_likes").delete().eq("user_id", user.id).eq("post_id", post.id);
      setLiked(false); setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("social_likes").insert({ user_id: user.id, post_id: post.id });
      setLiked(true); setLikeCount((c) => c + 1);
    }
  };

  const loadComments = async () => {
    const { data } = await supabase.from("social_comments")
      .select("id, content, created_at, user_id, profiles:user_id(full_name, username, avatar_url)")
      .eq("post_id", post.id)
      .order("created_at");
    setComments(data ?? []);
  };

  useEffect(() => { if (showComments) loadComments(); }, [showComments]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setPosting(true);
    await supabase.from("social_comments").insert({
      post_id: post.id, user_id: user.id, content: commentText.trim(),
    });
    setCommentText("");
    await loadComments();
    setPosting(false);
    onChange?.();
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return m + "m";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h";
    const d = Math.floor(h / 24);
    if (d < 7) return d + "d";
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border transition hover:shadow-md"
      style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>

      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <a href={"/u/?username=" + (post.author_username || "")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
          {post.author_avatar ? <img src={post.author_avatar} alt="" className="h-full w-full object-cover rounded-full" /> : initials}
        </a>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a href={"/u/?username=" + (post.author_username || "")} className="text-[14px] font-semibold hover:text-emerald-600">
              {post.author_name ?? "User"}
            </a>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: meta.color + "20", color: meta.color }}>
              {meta.emoji} {meta.label}
            </span>
          </div>
          <div className="text-[11px] flex items-center gap-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
            {post.author_headline && <span className="truncate">{post.author_headline}</span>}
            {post.institution_name && <span>· {post.institution_emoji} {post.institution_name}</span>}
            <span>· {timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3 -mt-1">
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={toggleLike}
          className={"flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium transition " + (liked ? "text-rose-600" : "")}
          style={!liked ? { color: "var(--text-muted)" } : {}}>
          {liked ? "❤️" : "🤍"} {likeCount > 0 ? likeCount : "Like"}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium"
          style={{ color: "var(--text-muted)" }}>
          💬 {post.comments_count > 0 ? post.comments_count : "Comment"}
        </button>
        <button
          onClick={() => { navigator.clipboard.writeText(window.location.origin + "/skb-education-ecosystem/feed/?post=" + post.id); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium"
          style={{ color: "var(--text-muted)" }}>
          🔗 Share
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t p-4" style={{ borderColor: "var(--border)", background: "var(--bg-soft)" }}>
          {comments.length === 0 ? (
            <div className="text-[12px] text-center py-3" style={{ color: "var(--text-muted)" }}>
              No comments yet — be the first!
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              {comments.map((c: any) => {
                const initial = (c.profiles?.full_name ?? "U").slice(0, 1).toUpperCase();
                return (
                  <div key={c.id} className="flex gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg,#10b981,#14b8a6)" }}>
                      {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} alt="" className="h-full w-full object-cover rounded-full" /> : initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background: "var(--surface-3)" }}>
                        <div className="text-[11px] font-semibold">{c.profiles?.full_name ?? "User"}</div>
                        <div className="mt-0.5">{c.content}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form onSubmit={submitComment} className="flex gap-2">
            <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded-full border px-3.5 py-2 text-[12px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <button type="submit" disabled={posting || !commentText.trim()}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50">
              Send
            </button>
          </form>
        </div>
      )}
      {/* Report — bottom right corner */}
      <div className="mt-2 flex justify-end">
        <ReportButton contentType="post" contentId={post.id} />
      </div>
    </div>
  );
}
