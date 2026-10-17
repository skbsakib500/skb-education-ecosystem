"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Search, Loader2, Trash2, Power, PowerOff,
  Filter, AlertTriangle, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

type BannedWord = {
  id: string;
  word: string;
  language: string;
  category: string;
  severity: string;
  is_active: boolean;
  created_at: string;
};

const CATEGORIES = ["profanity","harassment","hate","explicit","violence"];
const SEVERITIES = ["low","medium","high","critical"];
const LANGUAGES = ["bn","en","mix"];

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function BannedWordsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<BannedWord[]>([]);
  const [query, setQuery] = useState("");
  const [filterLang, setFilterLang] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [showActive, setShowActive] = useState<"all" | "active" | "inactive">("all");

  const [addOpen, setAddOpen] = useState(false);
  const [newWord, setNewWord] = useState("");
  const [newLang, setNewLang] = useState("mix");
  const [newCat, setNewCat] = useState("profanity");
  const [newSeverity, setNewSeverity] = useState("high");
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login/");
  }, [user, authLoading, router]);

  const load = async () => {
    const { data, error } = await supabase.rpc("admin_list_banned_words");
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setWords((data as BannedWord[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const add = async () => {
    if (!newWord.trim() || newWord.trim().length < 2) {
      toast.error("Word must be at least 2 characters");
      return;
    }
    const { error } = await supabase.rpc("admin_add_banned_word", {
      p_word: newWord.trim(),
      p_language: newLang,
      p_category: newCat,
      p_severity: newSeverity,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`"${newWord.trim()}" added to banned list`);
    setNewWord("");
    setAddOpen(false);
    await load();
  };

  const toggle = async (w: BannedWord) => {
    setWorking(w.id);
    const { error } = await supabase.rpc("admin_toggle_banned_word", { p_word_id: w.id });
    setWorking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(w.is_active ? "Word disabled" : "Word activated");
    await load();
  };

  const remove = async (w: BannedWord) => {
    if (!confirm(`Delete "${w.word}" permanently?`)) return;
    setWorking(w.id);
    const { error } = await supabase.rpc("admin_delete_banned_word", { p_word_id: w.id });
    setWorking(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Word deleted");
    await load();
  };

  const filtered = useMemo(() => {
    return words.filter((w) => {
      if (query && !w.word.toLowerCase().includes(query.toLowerCase())) return false;
      if (filterLang && w.language !== filterLang) return false;
      if (filterCat && w.category !== filterCat) return false;
      if (filterSeverity && w.severity !== filterSeverity) return false;
      if (showActive === "active" && !w.is_active) return false;
      if (showActive === "inactive" && w.is_active) return false;
      return true;
    });
  }, [words, query, filterLang, filterCat, filterSeverity, showActive]);

  const stats = useMemo(() => {
    return {
      total: words.length,
      active: words.filter((w) => w.is_active).length,
      bn: words.filter((w) => w.language === "bn").length,
      critical: words.filter((w) => w.severity === "critical").length,
    };
  }, [words]);

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading banned words…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link href="/moderation/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} /> Moderation
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Banned Words</h1>
          <p className="text-sm text-slate-500 mt-1">
            Posts/comments with these words are auto-hidden + auto-flagged for review
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus size={16} /> Add word
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="Active" value={stats.active} color="text-emerald-600" />
        <Stat label="Bengali" value={stats.bn} color="text-blue-600" />
        <Stat label="Critical" value={stats.critical} color="text-red-600" />
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search word…"
            className="w-full rounded-xl border border-slate-300 pl-10 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
            <option value="">All languages</option>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs capitalize">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs capitalize">
            <option value="">All severity</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={showActive} onChange={(e) => setShowActive(e.target.value as any)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
            <option value="all">All status</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No words match filters</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map((w) => (
              <div key={w.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50">
                <span className={`w-2 h-2 rounded-full ${w.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
                <span className="font-mono text-sm font-medium text-slate-900 min-w-0 flex-1 truncate">{w.word}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">{w.language}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 capitalize hidden sm:inline">{w.category}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold capitalize ${SEVERITY_COLOR[w.severity]}`}>{w.severity}</span>
                <button
                  onClick={() => toggle(w)}
                  disabled={working === w.id}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
                  title={w.is_active ? "Disable" : "Enable"}
                >
                  {working === w.id ? <Loader2 size={13} className="animate-spin" /> : w.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                </button>
                <button
                  onClick={() => remove(w)}
                  disabled={working === w.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Add banned word</h3>
              <button onClick={() => setAddOpen(false)} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Word / Phrase</label>
              <input
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                autoFocus
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 font-mono"
                placeholder="e.g. বাজে শব্দ"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Language</label>
                <select value={newLang} onChange={(e) => setNewLang(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs capitalize">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Severity</label>
                <select value={newSeverity} onChange={(e) => setNewSeverity(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs capitalize">
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>Any post/comment containing this word will be auto-hidden + flagged for review.</span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Cancel</button>
              <button onClick={add} className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "text-slate-900" }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
