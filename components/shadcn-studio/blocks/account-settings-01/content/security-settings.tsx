'use client'

import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, ViewOffIcon, ViewIcon, CheckmarkBadge01Icon, Cancel01Icon, Delete01Icon } from '@hugeicons/core-free-icons'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MFAChallenge } from '@/components/mfa-challenge'

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

export default function SecuritySettings({ user }: { user: any }) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [pendingNewPassword, setPendingNewPassword] = useState('')
  const [showMFA, setShowMFA] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()


  const toggleVisibility = () => setIsVisible(prevState => !prevState)

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

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (strengthScore < requirements.length) {
       toast.error("Please meet all password requirements before saving.");
       return;
    }
    setLoading(true);

    // 1. Verify current password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
       email: user?.email,
       password: currentPassword
    });

    if (signInError) {
       toast.error("Incorrect current password.");
       setLoading(false);
       return;
    }

    // 2. Check if MFA is required
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal2") {
       setPendingNewPassword(password);
       setShowMFA(true);
       setLoading(false);
       return;
    }

    // 3. No MFA needed, proceed to update
    await completePasswordUpdate(password);
  }

  async function completePasswordUpdate(pwd: string) {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: pwd
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully.");
      setPassword("");
      setCurrentPassword("");
      setShowMFA(false);
    }
    setLoading(false);
  }

  if (showMFA) {
    return (
      <div className='max-w-md mx-auto py-10'>
         <MFAChallenge onSuccess={() => completePasswordUpdate(pendingNewPassword)} />
         <Button variant="ghost" className="mt-4 w-full" onClick={() => setShowMFA(false)}>
           Cancel Password Change
         </Button>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='font-semibold'>Password</h3>
        <p className='text-muted-foreground text-sm'>Manage your password.</p>
      </div>

      {/* Content */}
      <div className='lg:col-span-2 space-y-10'>
        <form className='mx-auto space-y-6' onSubmit={handlePasswordUpdate}>
          <div className='w-full space-y-2'>
            <Label htmlFor='email' className='gap-1'>
              Email
            </Label>
            <InputGroup>
              <InputGroupInput id='email' type='email' value={user?.email || ""} disabled className="cursor-not-allowed bg-muted" />
              <InputGroupAddon align='inline-end' className='pr-2.75'>
                <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className='size-4' />
                <span className='sr-only'>Email</span>
              </InputGroupAddon>
            </InputGroup>
          </div>
          
          <div className='w-full space-y-2'>
            <Label htmlFor='current-password' className='gap-1'>
              Current Password
            </Label>
            <InputGroup className='mb-3'>
              <InputGroupInput
                id='current-password'
                type={isVisible ? 'text' : 'password'}
                placeholder='Current password'
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <InputGroupAddon align='inline-end' className='pr-1.5'>
                <Button
                  type="button"
                  variant='ghost'
                  size='icon'
                  onClick={toggleVisibility}
                  className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                >
                  {isVisible ? (
                    <HugeiconsIcon icon={ViewOffIcon} strokeWidth={2} className="size-4" />
                  ) : (
                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                  )}
                  <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </div>
          
          <div className='w-full space-y-2'>
            <Label htmlFor='new-password' className='gap-1'>
              Update Password
            </Label>
            <InputGroup className='mb-3'>
              <InputGroupInput
                id='new-password'
                type={isVisible ? 'text' : 'password'}
                placeholder='New password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <InputGroupAddon align='inline-end' className='pr-1.5'>
                <Button
                  type="button"
                  variant='ghost'
                  size='icon'
                  onClick={toggleVisibility}
                  className='text-muted-foreground focus-visible:ring-ring/50 rounded-l-none hover:bg-transparent'
                >
                  {isVisible ? (
                    <HugeiconsIcon icon={ViewOffIcon} strokeWidth={2} className="size-4" />
                  ) : (
                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                  )}
                  <span className='sr-only'>{isVisible ? 'Hide password' : 'Show password'}</span>
                </Button>
              </InputGroupAddon>
            </InputGroup>

            <div className='mb-4 flex h-1 w-full gap-1'>
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

            <p className='text-foreground text-sm font-medium'>{getText(strengthScore)}. Must contain :</p>

            <ul className='mb-4 space-y-1.5'>
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
          </div>

          <div className='mt-6 flex justify-end'>
            <Button type='submit' className='max-sm:w-full' disabled={loading || !password || !currentPassword}>
              {loading ? "Saving..." : "Update Password"}
            </Button>
          </div>
        </form>



      </div>
    </div>
  )
}
