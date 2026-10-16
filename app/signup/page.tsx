"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  signupSchema, type SignupInput,
  signupInstitutionStepSchema, type SignupInstitutionStepInput,
} from "@/lib/validation/schemas";

const INSTITUTION_TYPES = [
  { value: "high_school", label: "🏫 High School" },
  { value: "college", label: "🎓 College (HSC)" },
  { value: "public_university", label: "🏛️ Public University" },
  { value: "private_university", label: "🏛️ Private University" },
  { value: "polytechnic", label: "⚙️ Polytechnic" },
  { value: "medical_college", label: "⚕️ Medical College" },
  { value: "coaching", label: "📚 Coaching Center" },
  { value: "madrasa", label: "🕌 Madrasa" },
  { value: "other", label: "⭐ Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPw, setShowPw] = useState(false);

  const accountForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const instForm = useForm<SignupInstitutionStepInput>({
    resolver: zodResolver(signupInstitutionStepSchema),
    defaultValues: { name: "", slug: "", type: "high_school" },
  });

  // Auto-slug from name
  const instName = instForm.watch("name");
  const onInstNameChange = (v: string) => {
    instForm.setValue("name", v);
    const currentSlug = instForm.getValues("slug");
    const autoSlug = v
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    if (!currentSlug || currentSlug === autoSlug.slice(0, -1) || currentSlug === instName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      instForm.setValue("slug", autoSlug);
    }
  };

  const submitAccount = async (data: SignupInput) => {
    const { error } = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: { data: { full_name: data.fullName.trim() } },
    });

    if (error) {
      toast.error(error.message || "Signup failed");
      return;
    }

    toast.success("Account created — check your email to verify.");
    setStep(2);
  };

  const submitInstitution = async (data: SignupInstitutionStepInput) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Please verify your email, then sign in to continue.");
      router.push("/login/");
      return;
    }

    const { data: inst, error: instErr } = await supabase
      .from("institutions")
      .insert({
        name: data.name.trim(),
        slug: data.slug.toLowerCase().trim(),
        type: data.type,
      })
      .select()
      .single();

    if (instErr) {
      toast.error(instErr.message || "Failed to create institution");
      return;
    }

    const { error: memErr } = await supabase.from("memberships").insert({
      institution_id: inst.id,
      user_id: userData.user.id,
      role: "admin",
    });

    if (memErr) {
      toast.error(memErr.message || "Failed to link membership");
      return;
    }

    toast.success("Institution created! Welcome aboard.");
    router.push("/hub/");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg">
            S
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">
              {step === 1 ? "Create account" : "Register institution"}
            </div>
            <div className="text-xs text-slate-500">
              {step === 1 ? "অ্যাকাউন্ট খুলুন" : "প্রতিষ্ঠান যোগ করুন"}
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-6">
          <StepDot active={step === 1} done={step > 1} label="1" />
          <div className="flex-1 h-0.5 bg-slate-200">
            <div className={"h-full transition-all " + (step >= 2 ? "w-full bg-emerald-500" : "w-0")} />
          </div>
          <StepDot active={step === 2} done={false} label="2" />
        </div>

        {step === 1 && (
          <form onSubmit={accountForm.handleSubmit(submitAccount)} className="mt-6 space-y-4" noValidate>
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
                  {...accountForm.register("fullName")}
                  className={
                    "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                    (accountForm.formState.errors.fullName
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                  }
                />
              </div>
              {accountForm.formState.errors.fullName && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {accountForm.formState.errors.fullName.message}
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
                  placeholder="you@school.edu.bd"
                  {...accountForm.register("email")}
                  className={
                    "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                    (accountForm.formState.errors.email
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                  }
                />
              </div>
              {accountForm.formState.errors.email ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {accountForm.formState.errors.email.message}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400 flex items-start gap-1.5">
                  <span>💡</span>
                  <span>
                    Verification email আসবে <strong>SKB Education</strong> থেকে।
                  </span>
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
                  {...accountForm.register("password")}
                  className={
                    "w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none transition " +
                    (accountForm.formState.errors.password
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
              {accountForm.formState.errors.password && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {accountForm.formState.errors.password.message}
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
                  {...accountForm.register("confirmPassword")}
                  className={
                    "w-full rounded-xl border pl-10 pr-3 py-2.5 text-sm outline-none transition " +
                    (accountForm.formState.errors.confirmPassword
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                  }
                />
              </div>
              {accountForm.formState.errors.confirmPassword && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {accountForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={accountForm.formState.isSubmitting}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {accountForm.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {accountForm.formState.isSubmitting ? "Creating…" : "Continue →"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={instForm.handleSubmit(submitInstitution)} className="mt-6 space-y-4" noValidate>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-start gap-2">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <span>Account created. এখন আপনার প্রতিষ্ঠান যোগ করুন।</span>
            </div>

            {/* Institution Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Institution Name
              </label>
              <input
                type="text"
                placeholder="Dhaka Ideal School"
                value={instForm.watch("name")}
                onChange={(e) => onInstNameChange(e.target.value)}
                className={
                  "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition " +
                  (instForm.formState.errors.name
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100")
                }
              />
              {instForm.formState.errors.name && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {instForm.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                URL slug
              </label>
              <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <span className="pl-3 pr-1 text-xs text-slate-400 select-none">…/</span>
                <input
                  type="text"
                  placeholder="dhaka-ideal-school"
                  {...instForm.register("slug")}
                  className="flex-1 py-2.5 pr-3 text-sm outline-none bg-transparent"
                />
              </div>
              {instForm.formState.errors.slug ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {instForm.formState.errors.slug.message}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  শুধু lowercase letters, numbers, hyphen
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Type
              </label>
              <select
                {...instForm.register("type")}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {INSTITUTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {instForm.formState.errors.type && (
                <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={12} /> {instForm.formState.errors.type.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={instForm.formState.isSubmitting}
              className="w-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {instForm.formState.isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {instForm.formState.isSubmitting ? "Creating…" : "Finish setup →"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/hub/")}
              className="w-full text-xs text-slate-500 hover:text-slate-700"
            >
              Skip for now →
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login/" className="font-medium text-emerald-600 hover:underline">
            Sign in →
          </Link>
        </div>
      </div>
    </main>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div
      className={
        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition " +
        (done
          ? "bg-emerald-500 text-white"
          : active
          ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
          : "bg-slate-100 text-slate-400")
      }
    >
      {done ? "✓" : label}
    </div>
  );
}
