"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { signupSchema, type SignupInput } from "@/lib/validation/schemas";

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: SignupInput) => {
    const { error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: { data: { full_name: data.fullName.trim() } },
    });

    if (error) {
      toast.error(error.message || "Signup failed");
      return;
    }

    toast.success("Account created! Let's set you up.");
    router.push("/onboarding/");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            S
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            অ্যাকাউন্ট খুলুন — এরপর আপনার ভূমিকা বেছে নেবেন
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoComplete="name"
                placeholder="Sakib Al Hasan"
                {...form.register("fullName")}
                className={
                  "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                  (form.formState.errors.fullName
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                }
              />
            </div>
            {form.formState.errors.fullName && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> {form.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...form.register("email")}
                className={
                  "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                  (form.formState.errors.email
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                }
              />
            </div>
            {form.formState.errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min 8 chars, 1 letter, 1 number"
                {...form.register("password")}
                className={
                  "w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none transition " +
                  (form.formState.errors.password
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
            {form.formState.errors.password && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat password"
                {...form.register("confirmPassword")}
                className={
                  "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                  (form.formState.errors.confirmPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                }
              />
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={12} /> {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {form.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {form.formState.isSubmitting ? "Creating…" : "Create account →"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login/" className="font-semibold text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-[11px] text-slate-400 leading-relaxed">
          অ্যাকাউন্ট খোলার পর আপনি বেছে নেবেন — Institution Owner, Teacher, Student, Parent, Staff, বা Independent।
        </p>
      </div>
    </main>
  );
}
