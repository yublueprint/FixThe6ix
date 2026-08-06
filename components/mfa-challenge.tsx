"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";

type Props = {
  onSuccess: () => void;
};

export function MFAChallenge({ onSuccess }: Props) {
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    // Find the user's verified TOTP factor
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data) return;

      const totpFactors = data.totp.filter((f: any) => f.status === "verified");
      if (totpFactors.length > 0) {
        setFactorId(totpFactors[0].id);
      }
    })();
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;

    setLoading(true);
    setError("");

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });

    if (challengeError) {
      setError(challengeError.message);
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });

    if (verifyError) {
      setError("Invalid code. Please try again.");
      setVerifyCode("");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <Field>
            <FieldLabel>Verification Code</FieldLabel>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              required
              autoFocus
              className="text-center text-lg tracking-widest font-mono"
            />
            <FieldDescription>
              Open your authenticator app to find the code.
            </FieldDescription>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || verifyCode.length !== 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
