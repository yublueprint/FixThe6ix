"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import { MFATotpEnroll } from "./mfa-totp-enroll";
import { MFAPasskeyEnroll } from "./mfa-passkey-enroll";

const requirements = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[a-z]/, text: 'At least 1 lowercase letter' },
  { regex: /[A-Z]/, text: 'At least 1 uppercase letter' },
  { regex: /[0-9]/, text: 'At least 1 number' },
  {
    regex: /[!@#$%^&*()_+\-\=\[\]{};':"\\|,.<>\/?]/,
    text: 'At least 1 special character'
  }
]

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingInvite, setCheckingInvite] = useState(true);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const strength = requirements.map(req => ({
    met: req.regex.test(password),
    text: req.text
  }))

  const strengthScore = useMemo(() => {
    return strength.filter(req => req.met).length
  }, [strength])

  const getColor = (score: number) => {
    if (score === 0) return 'bg-border'
    if (score <= 1) return 'bg-destructive'
    if (score <= 2) return 'bg-orange-500 '
    if (score <= 3) return 'bg-amber-500'
    if (score === 4) return 'bg-yellow-400'
    return 'bg-green-500'
  }

  const getText = (score: number) => {
    if (score === 0) return 'Enter a password'
    if (score <= 2) return 'Weak password'
    if (score <= 3) return 'Medium password'
    if (score === 4) return 'Strong password'
    return 'Very strong password'
  }

  useEffect(() => {
    async function init() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";

      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (!error && data.user) {
            setEmail(data.user.email || "");
            setRole(data.user.user_metadata?.role || "VOLUNTEER");
            window.history.replaceState(null, "", window.location.pathname);
            if (data.user.user_metadata?.status === "ACTIVE") {
              router.push("/dashboard");
            }
            setCheckingInvite(false);
            return;
          }
        }
        setCheckingInvite(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setRole(user.user_metadata?.role || "VOLUNTEER");
        if (user.user_metadata?.status === "ACTIVE") {
          router.push("/dashboard");
        }
      }
      setCheckingInvite(false);
    }

    init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (strengthScore < requirements.length) {
      setError("Please meet all password requirements.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: {
        full_name: displayName,
        status: "ACTIVE"
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await fetch(`/api/users/${data.user?.id}/role-request`, {
       method: 'PATCH', 
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ status: "ACTIVE", name: displayName })
    }).catch(() => {});

    // Show MFA setup step instead of redirecting immediately
    setShowMFASetup(true);
    setLoading(false);
  }

  function finishSetup() {
    router.push("/dashboard");
    router.refresh();
  }

  if (checkingInvite) {
    return (
      <Card {...props}>
        <CardContent className="pt-6 flex justify-center">
          <p className="text-muted-foreground">Checking invitation...</p>
        </CardContent>
      </Card>
    )
  }

  if (!email) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Invitation Required</CardTitle>
          <CardDescription>
            Public registration is disabled. You must use the link provided in your invitation email to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={() => router.push("/login")}>
            Return to Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  // MFA setup step (shown after password is set)
  if (showMFASetup) {
    return (
      <Card {...props}>
        <CardHeader>
          <CardTitle>Secure your account</CardTitle>
          <CardDescription>
            Add extra security to your account. You can always set these up later in Account Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MFATotpEnroll
            showSkip={false}
            onComplete={() => {}}
          />
          <MFAPasskeyEnroll
            showSkip={false}
            onComplete={() => {}}
          />
          <div className="pt-2 border-t">
            <Button className="w-full" onClick={finishSetup}>
              Continue to Dashboard
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              You can set up security options later in Account Settings.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName">Display Name</FieldLabel>
              <Input
                id="displayName"
                placeholder="Jane Doe"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  disabled
                  value={email}
                  className="cursor-not-allowed bg-muted"
                />
              </Field>
              <Field>
                <FieldLabel>Assigned Role</FieldLabel>
                <Input
                  disabled
                  value={role}
                  className="cursor-not-allowed bg-muted font-medium text-foreground"
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <FieldDescription>
                <div className='mt-2 mb-4 flex h-1 w-full gap-1'>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-full flex-1 rounded-full transition-all duration-500 ease-out',
                        index < strengthScore ? getColor(strengthScore) : 'bg-border'
                      )}
                    />
                  ))}
                </div>

                <p className='text-foreground text-sm font-medium mb-2'>{getText(strengthScore)}. Must contain :</p>

                <ul className='space-y-1.5'>
                  {strength.map((req, index) => (
                    <li key={index} className='flex items-center gap-2'>
                      {req.met ? (
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} strokeWidth={2} className='size-4 text-green-600 dark:text-green-400' />
                      ) : (
                        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className='text-muted-foreground size-4' />
                      )}
                      <span
                        className={cn('text-xs', req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}
                      >
                        {req.text}
                        <span className='sr-only'>{req.met ? ' - Requirement met' : ' - Requirement not met'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Field>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {notice && (
              <p className="text-sm text-green-600">{notice}</p>
            )}
            <Field>
              <Button type="submit" loading={loading} loadingText="Completing setup…">
                Complete Setup
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
