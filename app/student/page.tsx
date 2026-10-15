import Link from "next/link";
export default function StudentPage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-emerald-600">← Home</Link>
        <h1 className="mt-4 text-3xl font-semibold">Student Dashboard</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>শিক্ষার্থী ড্যাশবোর্ড — শীঘ্রই আসছে</p>
      </div>
    </main>
  );
}
