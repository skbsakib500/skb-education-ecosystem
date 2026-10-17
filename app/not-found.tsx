import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-canvas-soft">
      <div className="max-w-md w-full text-center">
        <div className="text-[88px] font-black bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent leading-none">
          404
        </div>
        <h1 className="mt-4 text-2xl font-bold text-fg">Page not found</h1>
        <p className="mt-2 text-fluid-body-sm text-fg-muted">
          আপনি যে page খুঁজছেন সেটি নেই বা সরিয়ে ফেলা হয়েছে।
        </p>
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-fluid-body-sm font-medium text-white hover:bg-slate-800"
          >
            <Home size={14} /> Home
          </Link>
          <Link
            href="/dashboard/"
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-fluid-body-sm font-medium text-fg hover:bg-white"
          >
            <Search size={14} /> Browse Institutions
          </Link>
        </div>
      </div>
    </main>
  );
}
