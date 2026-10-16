"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AppError]", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          কিছু একটা ভুল হয়েছে। আপনি আবার চেষ্টা করতে পারেন, অথবা Hub-এ ফিরে যান।
        </p>
        {error.digest && (
          <p className="mt-3 text-[11px] font-mono text-slate-400">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <RefreshCw size={14} /> Try again
          </button>
          <Link
            href="/hub/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
          >
            <Home size={14} /> Go to Hub
          </Link>
        </div>
      </div>
    </main>
  );
}
