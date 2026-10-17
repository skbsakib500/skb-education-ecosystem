"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { Button, Card, Input, Badge } from "@/components/ui";

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
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-canvas">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-fluid-body shadow-elevation-2"
          >
            SKB
          </Link>
        </div>

        <Card variant="elevated" padding="lg" className="border-border-strong">
          <div className="text-center mb-8">
            <h1 className="text-fluid-h2 text-fg">Welcome back</h1>
            <p className="mt-2 text-fluid-body-sm text-fg-muted">
              Sign in to continue to your Hub
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              iconLeft={<Mail size={16} />}
              error={errors.email?.message}
              {...register("email")}
            />

            <div>
              <Input
                label="Password"
                type={showPw ? "text" : "password"}
                placeholder="Your password"
                autoComplete="current-password"
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
                error={errors.password?.message}
                {...register("password")}
              />

              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password/"
                  className="text-fluid-caption font-medium text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              iconRight={!isSubmitting ? <ArrowRight size={16} /> : undefined}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 rounded-lg border border-border bg-canvas-soft p-3 text-fluid-caption text-fg-muted">
            <Badge variant="accent" size="sm" className="mb-1.5">
              DEMO
            </Badge>
            <p className="leading-relaxed">
              Try{" "}
              <code className="text-fg font-semibold">
                demo.student@skb.local
              </code>{" "}
              /{" "}
              <code className="text-fg font-semibold">Demo@123456</code>
            </p>
          </div>

          {/* Signup link */}
          <div className="mt-6 text-center text-fluid-body-sm text-fg-muted">
            New here?{" "}
            <Link
              href="/get-started/"
              className="font-semibold text-accent hover:underline"
            >
              Get started
            </Link>
          </div>
        </Card>

        <div className="mt-6 text-center text-fluid-caption text-fg-subtle">
          <Link href="/" className="hover:text-fg">
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
