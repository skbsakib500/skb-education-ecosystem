import Link from "next/link";

export default function Home() {
  const dashboards = [
    { href: "/student", title: "Student", bn: "শিক্ষার্থী", color: "from-emerald-500 to-teal-600" },
    { href: "/teacher", title: "Teacher", bn: "শিক্ষক", color: "from-teal-500 to-cyan-600" },
    { href: "/admin", title: "Institution Admin", bn: "প্রতিষ্ঠান এডমিন", color: "from-emerald-600 to-teal-700" },
    { href: "/super-admin", title: "Super Admin (SKB)", bn: "সুপার এডমিন", color: "from-violet-500 to-indigo-600" },
  ];

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            SKB
          </div>
          <div>
            <h1 className="text-xl font-semibold">SKB Education Ecosystem</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Multi-Tenant EdTech Platform
            </p>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-semibold tracking-tight">
            Build the Infrastructure. Empower Every Institution.
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>
            একটি প্ল্যাটফর্ম — স্কুল, কলেজ, কোচিং সেন্টার প্রত্যেকে নিজের Admin দিয়ে পরিচালনা করবে।
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {dashboards.map((d) => (
            <Link
              key={d.href}
              href={d.href}
              className="rounded-2xl border p-6 transition hover:-translate-y-0.5"
              style={{ background: "var(--surface-3)", borderColor: "var(--border)" }}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${d.color} text-white font-bold`}>
                {d.title[0]}
              </div>
              <div className="mt-4 text-lg font-semibold">{d.title}</div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>{d.bn}</div>
              <div className="mt-3 text-sm font-medium text-emerald-600">Open →</div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center text-xs" style={{ color: "var(--text-faint)" }}>
          © 2025 SKB Education Ecosystem • Phase 1
        </div>
      </div>
    </main>
  );
}
