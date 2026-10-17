"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, Mail, Lock, User, Eye, EyeOff,
  ArrowLeft, MailCheck, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { signupSchema, type SignupInput } from "@/lib/validation/schemas";
import { isValidRole, getRole } from "@/lib/roles";
import { Button, Card, Input, Badge } from "@/components/ui";

export default function SignupPage() {
  return (
    <Suspense fallback={<FullSpinner />}>
      <SignupInner />
    </Suspense>
  );
}

function FullSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <Loader2 size={28} className="animate-spin text-accent" />
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

  // ── Email confirmation state ─────────────────────────────
  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-canvas">
        <Card variant="elevated" padding="lg" className="w-full max-w-md text-center border-border-strong">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MailCheck size={26} />
          </div>

          <h1 className="mt-5 text-fluid-h2 text-fg">Check your email</h1>

          <p className="mt-3 text-fluid-body-sm text-fg-muted leading-relaxed">
            <span className="font-semibold text-fg break-all">{emailSent}</span>{" "}
            ঠিকানায় confirmation link পাঠানো হয়েছে। Link-এ click করলে সরাসরি{" "}
            <span className="font-semibold text-fg">{meta?.label}</span> onboarding শুরু হবে।
          </p>

          <div className="mt-6 space-y-2">
            <Button
              onClick={resend}
              disabled={resending}
              loading={resending}
              variant="outline"
              fullWidth
              iconLeft={!resending ? <RefreshCw size={15} /> : undefined}
            >
              {resending ? "Resending..." : "Resend email"}
            </Button>
            <Link href="/login/" className="block">
              <Button variant="primary" fullWidth>
                Already confirmed? Sign in
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-fluid-caption text-fg-subtle">
            Email না পেলে Spam folder দেখুন · Link ২৪ ঘণ্টা valid
          </p>
        </Card>
      </main>
    );
  }

  // ── Signup form ──────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-12 bg-canvas">
      <Card variant="elevated" padding="lg" className="w-full max-w-md border-border-strong">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/get-started/"
            className="inline-flex items-center gap-1 text-fluid-caption text-fg-muted hover:text-fg"
          >
            <ArrowLeft size={14} /> Change role
          </Link>
          {meta && (
            <Badge variant="accent" size="md">
              <span>{meta.emoji}</span>
              {meta.label}
            </Badge>
          )}
        </div>

        {/* Brand + heading */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-fluid-body shadow-elevation-2">
            SKB
          </div>
          <h1 className="mt-4 text-fluid-h2 text-fg">Create your account</h1>
          <p className="text-fluid-body-sm text-fg-muted mt-1">
            {meta ? `${meta.label} হিসেবে অ্যাকাউন্ট খুলুন` : "অ্যাকাউন্ট খুলুন"}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label="Full Name"
            type="text"
            placeholder="Sakib Al Hasan"
            autoComplete="name"
            required
            iconLeft={<User size={16} />}
            error={form.formState.errors.fullName?.message}
            {...form.register("fullName")}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            iconLeft={<Mail size={16} />}
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />

          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            placeholder="Min 8 chars, 1 letter, 1 number"
            autoComplete="new-password"
            required
            iconLeft={<Lock size={16} />}
            iconRight={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="p-0.5 rounded text-fg-muted hover:text-fg"
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            error={form.formState.errors.password?.message}
            {...form.register("password")}
          />

          <Input
            label="Confirm Password"
            type={showPw ? "text" : "password"}
            placeholder="Repeat password"
            autoComplete="new-password"
            required
            iconLeft={<Lock size={16} />}
            error={form.formState.errors.confirmPassword?.message}
            {...form.register("confirmPassword")}
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={form.formState.isSubmitting}
            iconRight={
              !form.formState.isSubmitting ? <span aria-hidden>→</span> : undefined
            }
          >
            {form.formState.isSubmitting ? "Creating..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-fluid-body-sm text-fg-muted">
          Already have an account?{" "}
          <Link href="/login/" className="font-semibold text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </main>
  );
}
