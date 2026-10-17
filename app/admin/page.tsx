import Link from "next/link";
export default function AdminPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-fluid-body-sm text-emerald-600">← Home</Link>
        <h1 className="mt-4 text-3xl font-semibold">Institution Admin Dashboard</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>প্রতিষ্ঠান এডমিন ড্যাশবোর্ড — শীঘ্রই আসছে</p>
      </div>
    </main>
  );
}
