"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo =
      (process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin) + "/reset-password";

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);
    if (authError) { setError(authError.message); return; }
    setSent(true);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-2xl font-bold mb-4">
          B
        </div>
        <h1 className="text-xl font-bold text-foreground">Bee Hospitality</h1>
        <p className="text-sm text-muted-foreground mt-1">Audit Pro · Operations Platform</p>
      </div>

      <Card className="shadow-card-hover">
        <CardHeader className="pb-4">
          <p className="text-sm font-medium text-foreground">Reset your password</p>
          <p className="text-xs text-muted-foreground">
            Enter your work email and we'll send a reset link
          </p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-semibold text-foreground">Check your email</p>
              <p className="text-xs text-muted-foreground">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                The link expires in 1 hour.
              </p>
              <Link href="/login" className="text-xs text-primary font-medium hover:underline mt-2">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@beegroup.cy"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="pl-8"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-5 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
