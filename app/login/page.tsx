"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim(),
      password: data.password,
    });

    if (error) {
      toast.error(error.message || "Login failed");
      return;
    }

    toast.success("Welcome back!");
    router.push("/hub/");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            S
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sign in to continue to your Hub
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                className={
                  "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                  (errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                }
              />
            </div>
            {errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
                className={
                  "w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none transition " +
                  (errors.password
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                }
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Link
              href="/forgot-password/"
              className="text-xs text-slate-500 hover:text-emerald-600"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup/" className="font-semibold text-emerald-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
