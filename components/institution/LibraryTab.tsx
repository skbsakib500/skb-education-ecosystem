"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["general","textbook","reference","fiction","science","history","islamic","literature","kids"];

export default function LibraryTab({ institutionId, isAdmin }: { institutionId: string; isAdmin: boolean }) {
  const [view, setView] = useState<"books"|"issues"|"overdue">("books");
  const [books, setBooks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const [bForm, setBForm] = useState({ title: "", author: "", isbn: "", category: "general", publisher: "", total_copies: 1, shelf: "", cover_url: "" });
  const [iForm, setIForm] = useState({ book_id: "", student_id: "", due_date: new Date(Date.now() + 14*864e5).toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    const [bRes, sRes, iRes, stRes] = await Promise.all([
      supabase.rpc("search_books", { p_institution_id: institutionId, p_query: q, p_category: cat || null, p_limit: 100 }),
      supabase.rpc("library_stats", { p_institution_id: institutionId }),
      supabase.from("library_issues").select("*, library_books:book_id(title, author), students:student_id(full_name, student_id)").eq("institution_id", institutionId).order("issued_at", { ascending: false }).limit(100),
      supabase.from("students").select("id, full_name, student_id").eq("institution_id", institutionId).order("full_name"),
    ]);
    setBooks(bRes.data ?? []);
    setStats(sRes.data);
    setIssues(iRes.data ?? []);
    setStudents(stRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [institutionId]);

  const addBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr("");
    const { error } = await supabase.from("library_books").insert({
      institution_id: institutionId,
      title: bForm.title.trim(), author: bForm.author.trim() || null,
      isbn: bForm.isbn.trim() || null, category: bForm.category,
      publisher: bForm.publisher.trim() || null,
      total_copies: bForm.total_copies, available_copies: bForm.total_copies,
      shelf: bForm.shelf.trim() || null, cover_url: bForm.cover_url.trim() || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setBForm({ title: "", author: "", isbn: "", category: "general", publisher: "", total_copies: 1, shelf: "", cover_url: "" });
    setShowBookForm(false); await load();
  };

  const issueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iForm.book_id || !iForm.student_id) { setErr("Select book + student"); return; }
    setSaving(true); setErr("");
    const { error } = await supabase.from("library_issues").insert({
      institution_id: institutionId, book_id: iForm.book_id,
      student_id: iForm.student_id, due_date: iForm.due_date,
      issued_by: (await supabase.auth.getUser()).data.user?.id,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setIForm({ book_id: "", student_id: "", due_date: new Date(Date.now() + 14*864e5).toISOString().slice(0,10) });
    setShowIssueForm(false); await load();
  };

  const markReturned = async (issueId: string) => {
    const { error } = await supabase.from("library_issues").update({
      status: "returned", returned_at: new Date().toISOString(),
    }).eq("id", issueId);
    if (error) { alert(error.message); return; }
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-[16px] font-semibold">Library · <span className="bangla font-normal">লাইব্রেরি</span></h2>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={() => setShowBookForm(!showBookForm)}
                className="rounded-full border px-3 py-1.5 text-[12px] font-semibold"
                style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                {showBookForm ? "Cancel" : "+ Add Book"}
              </button>
              <button onClick={() => setShowIssueForm(!showIssueForm)}
                className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow">
                {showIssueForm ? "Cancel" : "📚 Issue Book"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <Stat emoji="📚" value={stats.total_books} label="Books" />
          <Stat emoji="📖" value={stats.total_copies} label="Total Copies" />
          <Stat emoji="✅" value={stats.available_copies} label="Available" />
          <Stat emoji="⏳" value={stats.issued_now} label="Issued" />
          <Stat emoji="⚠️" value={stats.overdue} label="Overdue" />
        </div>
      )}

      {/* Add Book form */}
      {showBookForm && isAdmin && (
        <form onSubmit={addBook} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" required placeholder="Title *" value={bForm.title}
              onChange={(e) => setBForm({ ...bForm, title: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" placeholder="Author" value={bForm.author}
              onChange={(e) => setBForm({ ...bForm, author: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" placeholder="ISBN" value={bForm.isbn}
              onChange={(e) => setBForm({ ...bForm, isbn: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={bForm.category} onChange={(e) => setBForm({ ...bForm, category: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input type="text" placeholder="Publisher" value={bForm.publisher}
              onChange={(e) => setBForm({ ...bForm, publisher: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="number" min="1" placeholder="Copies" value={bForm.total_copies}
              onChange={(e) => setBForm({ ...bForm, total_copies: parseInt(e.target.value) || 1 })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" placeholder="Shelf" value={bForm.shelf}
              onChange={(e) => setBForm({ ...bForm, shelf: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <input type="text" placeholder="Cover URL" value={bForm.cover_url}
              onChange={(e) => setBForm({ ...bForm, cover_url: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "Save Book"}
          </button>
        </form>
      )}

      {/* Issue Book form */}
      {showIssueForm && isAdmin && (
        <form onSubmit={issueBook} className="mb-4 rounded-2xl border p-4 space-y-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select required value={iForm.book_id} onChange={(e) => setIForm({ ...iForm, book_id: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Book —</option>
              {books.filter((b) => b.available_copies > 0).map((b) => (
                <option key={b.id} value={b.id}>{b.title} ({b.available_copies})</option>
              ))}
            </select>
            <select required value={iForm.student_id} onChange={(e) => setIForm({ ...iForm, student_id: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">— Student —</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}{s.student_id ? " · " + s.student_id : ""}</option>)}
            </select>
            <input type="date" required value={iForm.due_date}
              onChange={(e) => setIForm({ ...iForm, due_date: e.target.value })}
              className="rounded-xl border px-3.5 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
          </div>
          {err && <div className="text-[12px] text-rose-600">{err}</div>}
          <button type="submit" disabled={saving}
            className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
            {saving ? "..." : "Issue Book"}
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-full border p-1 mb-4 text-[12px] w-fit"
        style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
        {[
          { k: "books" as const, l: "📚 Books" },
          { k: "issues" as const, l: "📋 Issued" },
          { k: "overdue" as const, l: "⚠️ Overdue" },
        ].map((t) => (
          <button key={t.k} onClick={() => setView(t.k)}
            className={"rounded-full px-3 py-1.5 font-medium whitespace-nowrap " + (view === t.k ? "bg-[var(--text)] text-[var(--bg)]" : "")}
            style={view !== t.k ? { color: "var(--text-muted)" } : {}}>{t.l}</button>
        ))}
      </div>

      {view === "books" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="🔍 Search title, author, ISBN..."
              className="rounded-full border px-4 py-2 text-[13px] outline-none sm:col-span-2"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }} />
            <select value={cat} onChange={(e) => { setCat(e.target.value); setTimeout(load, 100); }}
              className="rounded-full border px-4 py-2 text-[13px] outline-none"
              style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-10 text-[13px]" style={{ color: "var(--text-muted)" }}>Loading...</div>
          ) : books.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
              <div className="text-[36px]">📚</div>
              <div className="mt-2 text-[14px] font-semibold">No books</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {books.map((b) => (
                <div key={b.id} className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
                  {b.cover_url ? (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: "url(" + b.cover_url + ")" }} />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-[40px]"
                      style={{ background: "linear-gradient(135deg,#10b98120,#14b8a620)" }}>📖</div>
                  )}
                  <div className="p-3">
                    <div className="text-[13px] font-semibold line-clamp-2">{b.title}</div>
                    <div className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{b.author || "—"}</div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="capitalize" style={{ color: "var(--text-faint)" }}>{b.category}</span>
                      <span className={"rounded-full px-2 py-0.5 font-semibold " + (b.available_copies > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-rose-500/15 text-rose-700")}>
                        {b.available_copies}/{b.total_copies}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "issues" && (
        <IssueList issues={issues.filter((i) => i.status === "issued" && new Date(i.due_date) >= new Date())} onReturn={markReturned} isAdmin={isAdmin} />
      )}

      {view === "overdue" && (
        <IssueList issues={issues.filter((i) => i.status === "issued" && new Date(i.due_date) < new Date())} onReturn={markReturned} isAdmin={isAdmin} overdue />
      )}
    </div>
  );
}

function Stat({ emoji, value, label }: any) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[18px]">{emoji}</div>
      <div className="text-[20px] font-bold mt-1">{value}</div>
      <div className="text-[10px] uppercase font-medium" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function IssueList({ issues, onReturn, isAdmin, overdue }: any) {
  if (issues.length === 0) return (
    <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-3)" }}>
      <div className="text-[36px]">{overdue ? "✨" : "📋"}</div>
      <div className="mt-2 text-[14px] font-semibold">{overdue ? "No overdue books" : "No issued books"}</div>
    </div>
  );
  return (
    <div className="space-y-2">
      {issues.map((i) => (
        <div key={i.id} className={"rounded-2xl border p-3 flex items-center gap-3 " + (overdue ? "border-rose-500/30 bg-rose-500/5" : "")}
          style={!overdue ? { borderColor: "var(--border)", background: "var(--surface-3)" } : {}}>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{i.library_books?.title}</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {i.students?.full_name || "—"} · Due {new Date(i.due_date).toLocaleDateString()}
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => onReturn(i.id)}
              className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
              ✓ Returned
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
