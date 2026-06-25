"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type PageState = "loading" | "ready" | "saving" | "done" | "error";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get("code");

    if (code) {
      // PKCE flow — exchange the one-time code for a live session
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) { setErrorMsg(error.message); setState("error"); }
        else setState("ready");
      });
    } else {
      // Hash-based flow — Supabase fires PASSWORD_RECOVERY on the auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") setState("ready");
      });
      // If no code and no hash event within 3s, something is wrong
      const t = setTimeout(() => {
        setState("error");
        setErrorMsg("Invalid or expired reset link. Request a new one.");
      }, 3000);
      return () => { subscription.unsubscribe(); clearTimeout(t); };
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg("Passwords do not match."); return; }
    if (password.length < 8) { setErrorMsg("Password must be at least 8 characters."); return; }
    setErrorMsg(null);
    setState("saving");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setErrorMsg(error.message); setState("ready"); return; }
    setState("done");
    setTimeout(() => router.replace("/dashboard"), 1500);
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
          <p className="text-sm font-medium text-foreground">Set a new password</p>
          <p className="text-xs text-muted-foreground">Choose a strong password for your account</p>
        </CardHeader>
        <CardContent>
          {state === "loading" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Verifying reset link…</p>
            </div>
          )}

          {state === "error" && (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <AlertTriangle className="h-10 w-10 text-red-500" />
              <p className="text-sm font-semibold text-foreground">Link invalid or expired</p>
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
              <Button size="sm" variant="outline" onClick={() => router.push("/forgot-password")}>
                Request a new link
              </Button>
            </div>
          )}

          {state === "done" && (
            <div className="flex flex-col items-center py-6 text-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm font-semibold text-foreground">Password updated</p>
              <p className="text-xs text-muted-foreground">Redirecting to dashboard…</p>
            </div>
          )}

          {(state === "ready" || state === "saving") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="password">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPw(!showPw)}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground" htmlFor="confirm">
                  Confirm password
                </label>
                <Input
                  id="confirm"
                  type={showPw ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={state === "saving"}>
                {state === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
                {state === "saving" ? "Saving…" : "Set new password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
