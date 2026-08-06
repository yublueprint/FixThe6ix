"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MFAChallenge } from "./mfa-challenge";
import { HugeiconsIcon } from "@hugeicons/react";
import { FingerPrintIcon } from "@hugeicons/core-free-icons";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient() as any;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Check if user needs MFA verification
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
      // User has MFA enrolled but hasn't verified yet — show challenge
      setShowMFA(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handlePasskeySignIn() {
    setPasskeyLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPasskey();
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message || "Passkey sign-in cancelled.");
    }
    setPasskeyLoading(false);
  }

  function handleMFASuccess() {
    router.push("/dashboard");
    router.refresh();
  }

  if (showMFA) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <MFAChallenge onSuccess={handleMFASuccess} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in…" : "Login"}
                </Button>
              </Field>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handlePasskeySignIn}
                disabled={passkeyLoading}
              >
                <HugeiconsIcon icon={FingerPrintIcon} strokeWidth={2} className="size-4 mr-2" />
                {passkeyLoading ? "Waiting for device…" : "Sign in with Passkey"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="underline underline-offset-4 hover:text-primary">
                  Sign up
                </a>
              </p>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
