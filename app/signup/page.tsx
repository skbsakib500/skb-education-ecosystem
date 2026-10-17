"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle,
  ArrowLeft, MailCheck, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { signupSchema, type SignupInput } from "@/lib/validation/schemas";
import { isValidRole, getRole } from "@/lib/roles";

export default function SignupPage() {
  return (
    <Suspense fallback={<FullSpinner />}>
      <SignupInner />
    </Suspense>
  );
}

function FullSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 size={28} className="animate-spin text-emerald-600" />
    </div>
  );
}

function buildCallbackUrl(next: string) {
  if (typeof window === "undefined") return undefined;
  const base = window.location.pathname.replace(/\/signup\/?$/, "");
  return `${window.location.origin}${base}/auth/callback/?next=${encodeURIComponent(next)}`;
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const role = isValidRole(roleParam) ? roleParam : null;
  const meta = role ? getRole(role) : null;

  const [showPw, setShowPw] = useState(false);
  const [emailSent, setEmailSent] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!role) router.replace("/get-started/");
  }, [role, router]);

  if (!role) return <FullSpinner />;

  const nextPath = `/onboarding/${role}/`;

  const onSubmit = async (data: SignupInput) => {
    const email = data.email.trim().toLowerCase();
    const { data: res, error } = await supabase.auth.signUp({
      email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName.trim(),
          intended_role: role,
        },
        emailRedirectTo: buildCallbackUrl(nextPath),
      },
    });

    if (error) {
      toast.error(error.message || "Signup failed");
      return;
    }

    if (res.session) {
      toast.success("Account created!");
      router.push(nextPath);
      router.refresh();
      return;
    }

    setEmailSent(email);
    toast.success("Account created — confirm your email.");
  };

  const resend = async () => {
    if (!emailSent) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailSent,
      options: { emailRedirectTo: buildCallbackUrl(nextPath) },
    });
    setResending(false);
    if (error) toast.error(error.message);
    else toast.success("Confirmation email resent.");
  };

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <MailCheck size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            <span className="font-medium text-slate-700 break-all">{emailSent}</span> ঠিকানায় confirmation link পাঠানো হয়েছে।
            Link-এ click করলে সরাসরি <span className="font-medium">{meta?.label}</span> onboarding শুরু হবে।
          </p>
          <div className="mt-6 space-y-2">
            <button
              onClick={resend}
              disabled={resending}
              className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {resending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Resend email
            </button>
            <Link
              href="/login/"
              className="block w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Already confirmed? Sign in
            </Link>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            Email না পেলে Spam folder দেখুন · Link ২৪ ঘণ্টা valid
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
        <div className="flex items-center justify-between">
          <Link
            href="/get-started/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={13} /> Change role
          </Link>
          {meta && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ background: meta.color + "18", color: meta.color }}
            >
              <span>{meta.emoji}</span> {meta.label}
            </span>
          )}
        </div>

        <div className="text-center mt-4 mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            S
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            {meta ? `${meta.label} হিসেবে অ্যাকাউন্ট খুলুন` : "অ্যাকাউন্ট খুলুন"}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
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

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
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

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
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

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Password</label>
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
      </div>
    </main>
  );
}
