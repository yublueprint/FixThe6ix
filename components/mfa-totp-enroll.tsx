"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type Props = {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
};

export function MFATotpEnroll({ onComplete, onSkip, showSkip = true }: Props) {
  const [factorId, setFactorId] = useState("");
  const [qrUri, setQrUri] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [appName, setAppName] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function startEnroll() {
    if (!appName.trim()) {
       toast.error("Please enter a name for this authenticator.");
       return;
    }

    setEnrolling(true);
    setError("");

    // Cleanup unverified factors to prevent "already enrolling" errors
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data && data.totp) {
        const unverified = data.totp.filter((f: any) => f.status === "unverified");
        for (const uf of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: uf.id });
        }
      }
    } catch(e) {}

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: appName.trim(),
    });

    if (error) {
      toast.error(error.message);
      setEnrolling(false);
      return;
    }

    setFactorId(data.id);
    setQrUri(data.totp.uri);
    setSecret(data.totp.secret);
  }

  async function verifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
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
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    setEnrolled(true);
    toast.success("Authenticator app linked successfully!");
    setLoading(false);
    onComplete?.();
  }

  if (enrolled) {
    return (
      <div className="text-center py-4 space-y-2">
        <div className="text-green-600 font-medium text-sm">
          ✓ Authenticator app is set up
        </div>
        {showSkip && (
          <Button variant="outline" size="sm" onClick={onSkip}>
            Continue
          </Button>
        )}
      </div>
    );
  }

  if (!enrolling) {
    return (
      <div className="space-y-3">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Choose a name for this authenticator (e.g., "My Phone"), then scan the QR code in your app.
          </p>
          <Field>
            <FieldLabel>App Name</FieldLabel>
            <Input 
              value={appName} 
              onChange={e => setAppName(e.target.value)} 
              placeholder="e.g. iPhone Authenticator" 
            />
          </Field>
          <Button type="button" variant="default" size="sm" className="w-full mt-2" onClick={startEnroll}>
            Continue
          </Button>
        </div>
        {showSkip && (
          <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
        <h4 className="text-sm font-semibold">Scan QR Code</h4>
        <p className="text-xs text-muted-foreground">
          Open your authenticator app and scan this QR code:
        </p>

        <div className="flex justify-center py-2">
          <QRCodeSVG value={qrUri} size={180} level="M" />
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Can't scan? Enter code manually
          </summary>
          <code className="block mt-2 p-2 bg-muted rounded text-xs break-all font-mono select-all">
            {secret}
          </code>
        </details>

        <form onSubmit={verifyEnrollment} className="space-y-3">
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
              className="text-center text-lg tracking-widest font-mono"
            />
            <FieldDescription>
              Enter the 6-digit code from your authenticator app.
            </FieldDescription>
          </Field>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => { setEnrolling(false); setError(""); }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="flex-1" loading={loading} loadingText="Verifying…" disabled={verifyCode.length !== 6}>
              Verify & Enable
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
