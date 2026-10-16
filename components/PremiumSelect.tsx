"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  bn?: string;
  emoji?: string;
}

export interface SelectGroup {
  category: string;
  meta: { label: string; bn: string; emoji: string };
  items: SelectOption[];
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[] | SelectGroup[];
  placeholder?: string;
  searchable?: boolean;
}

function isGrouped(opts: any[]): opts is SelectGroup[] {
  return opts.length > 0 && typeof opts[0] === "object" && "category" in opts[0] && "items" in opts[0];
}

export default function PremiumSelect({
  value, onChange, options, placeholder = "Select...", searchable = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const allItems = useMemo(() => {
    if (isGrouped(options)) return options.flatMap((g) => g.items);
    return options;
  }, [options]);

  const current = allItems.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    if (isGrouped(options)) {
      return options
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (it) =>
              it.label.toLowerCase().includes(q) ||
              (it.bn ?? "").includes(query) ||
              it.value.toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.items.length > 0);
    }
    return options.filter(
      (it) => it.label.toLowerCase().includes(q) || (it.bn ?? "").includes(query)
    );
  }, [options, query]);

  const total = isGrouped(filtered)
    ? filtered.reduce((s, g) => s + g.items.length, 0)
    : filtered.length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition hover:border-emerald-500/40"
        style={{
          borderColor: open ? "rgba(16,185,129,0.5)" : "var(--border)",
          background: "var(--surface-3)",
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {current?.emoji && <span className="shrink-0 text-[17px]">{current.emoji}</span>}
          <div className="min-w-0">
            {current ? (
              <>
                <div className="truncate text-[13.5px] font-medium">{current.label}</div>
                {current.bn && (
                  <div className="bangla truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {current.bn}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[13.5px]" style={{ color: "var(--text-muted)" }}>{placeholder}</div>
            )}
          </div>
        </div>
        <ChevronDown
          className={"h-4 w-4 shrink-0 transition " + (open ? "rotate-180" : "")}
          style={{ color: "var(--text-muted)" }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-3)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}
        >
          {searchable && (
            <div className="border-b p-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg-soft)" }}>
                <Search className="h-3.5 w-3.5" style={{ color: "var(--text-faint)" }} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent text-[13px] outline-none"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="rounded-full p-0.5 hover:bg-[var(--bg-soft)]">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-[340px] overflow-y-auto p-1.5">
            {isGrouped(filtered) ? (
              filtered.map((g) => (
                <div key={g.category} className="mb-1 last:mb-0">
                  <div
                    className="sticky top-0 z-10 flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest backdrop-blur"
                    style={{ color: "var(--text-faint)", background: "var(--surface-3)" }}
                  >
                    <span className="text-[12px]">{g.meta.emoji}</span>
                    <span>{g.meta.label}</span>
                    <span className="bangla normal-case font-normal">· {g.meta.bn}</span>
                    <span className="ml-auto rounded-full px-1.5 py-0.5 text-[9px]" style={{ background: "var(--bg-soft)" }}>
                      {g.items.length}
                    </span>
                  </div>
                  {g.items.map((it) => (
                    <OptionRow
                      key={it.value}
                      option={it}
                      selected={it.value === value}
                      onClick={() => { onChange(it.value); setOpen(false); setQuery(""); }}
                    />
                  ))}
                </div>
              ))
            ) : (
              (filtered as SelectOption[]).map((it) => (
                <OptionRow
                  key={it.value}
                  option={it}
                  selected={it.value === value}
                  onClick={() => { onChange(it.value); setOpen(false); setQuery(""); }}
                />
              ))
            )}

            {total === 0 && (
              <div className="p-8 text-center">
                <div className="text-[24px]">🔍</div>
                <div className="mt-2 text-[12px]" style={{ color: "var(--text-muted)" }}>
                  No results for "<span className="font-medium">{query}</span>"
                </div>
              </div>
            )}
          </div>

          <div
            className="border-t px-3 py-2 text-[10px] font-mono"
            style={{ borderColor: "var(--border)", background: "var(--bg-soft)", color: "var(--text-faint)" }}
          >
            {total} option{total !== 1 ? "s" : ""} · Esc to close
          </div>
        </div>
      )}
    </div>
  );
}

function OptionRow({
  option, selected, onClick,
}: {
  option: SelectOption;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition " +
        (selected ? "bg-emerald-500/10" : "hover:bg-[var(--bg-soft)]")
      }
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {option.emoji && <span className="shrink-0 text-[16px]">{option.emoji}</span>}
        <div className="min-w-0">
          <div
            className={
              "truncate text-[13px] " +
              (selected ? "font-semibold text-emerald-700 dark:text-emerald-300" : "font-medium")
            }
          >
            {option.label}
          </div>
          {option.bn && (
            <div className="bangla truncate text-[11px]" style={{ color: "var(--text-muted)" }}>
              {option.bn}
            </div>
          )}
        </div>
      </div>
      {selected && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
    </button>
  );
}
