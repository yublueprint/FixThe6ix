'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete01Icon, Edit01Icon } from '@hugeicons/core-free-icons'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { MFATotpEnroll } from '@/components/mfa-totp-enroll'
import { MFAPasskeyEnroll } from '@/components/mfa-passkey-enroll'

export default function MfaSettings({ user }: { user: any }) {
  const [totpFactors, setTotpFactors] = useState<any[]>([])
  const [showTotpEnroll, setShowTotpEnroll] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const supabase = createClient()

  useEffect(() => {
    loadMFAFactors();
  }, [user]);

  async function loadMFAFactors() {
    try {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) {
        setTotpFactors(data.totp.filter((f: any) => f.status === "verified"));
      }
    } catch (e) {}
  }

  async function unenrollTotp(factorId: string) {
    if (!window.confirm("Remove this authenticator? You will no longer need a code to sign in.")) return;
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Authenticator removed.");
      await supabase.auth.refreshSession();
      loadMFAFactors();
    }
  }

  async function renameTotp(id: string) {
    toast.error("Supabase does not currently support renaming TOTP authenticators. Please remove and re-add the authenticator to change its name.");
    setEditingId(null);
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='font-semibold'>Multi-Factor Authentication</h3>
        <p className='text-muted-foreground text-sm'>Add an extra layer of security to your account with TOTP apps or Passkeys.</p>
      </div>

      {/* Content */}
      <div className='lg:col-span-2 space-y-10'>
        <div className="space-y-6">
           <div className="w-full space-y-2">
             <Label className='gap-1'>Authenticator App (TOTP)</Label>
             {totpFactors.length > 0 ? (
               <div className="space-y-4 mt-2">
                 {totpFactors.map((factor) => (
                   <div key={factor.id} className="flex items-center justify-between p-4 border rounded-md bg-card text-card-foreground text-sm shadow-sm">
                     {editingId === factor.id ? (
                       <div className="flex items-center gap-2 flex-1">
                         <Input
                           value={editName}
                           onChange={(e) => setEditName(e.target.value)}
                           placeholder="App name"
                           className="h-7 text-xs"
                         />
                         <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => renameTotp(factor.id)}>
                           Save
                         </Button>
                         <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                           Cancel
                         </Button>
                       </div>
                     ) : (
                       <>
                         <div className="flex flex-col">
                           <span className="text-sm font-medium">{factor.friendly_name || "Authenticator App"}</span>
                           <span className="text-xs text-muted-foreground mt-1">Status: <span className="text-green-600 font-medium">Active</span></span>
                         </div>
                         <div className="flex items-center gap-1">
                           <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             className="text-muted-foreground hover:text-blue-500 hover:bg-blue-50"
                             onClick={() => { setEditingId(factor.id); setEditName(factor.friendly_name || ""); }}
                           >
                             <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                           </Button>
                           <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                             onClick={() => unenrollTotp(factor.id)}
                           >
                             <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4" />
                           </Button>
                         </div>
                       </>
                     )}
                   </div>
                 ))}
                 {!showTotpEnroll && (
                   <div className="flex justify-end">
                     <Button
                       type="button"
                       variant="default"
                       className="max-sm:w-full"
                       onClick={() => setShowTotpEnroll(true)}
                     >
                       Add another authenticator
                     </Button>
                   </div>
                 )}
               </div>
             ) : !showTotpEnroll ? (
               <div className="flex justify-start mt-2">
                 <Button
                   type="button"
                   variant="default"
                   className="max-sm:w-full"
                   onClick={() => setShowTotpEnroll(true)}
                 >
                   Set up Authenticator
                 </Button>
               </div>
             ) : null}

             {showTotpEnroll && (
               <div className="mt-4 p-4 border rounded-md bg-card text-card-foreground shadow-sm">
                 <MFATotpEnroll
                   showSkip={false}
                   onComplete={() => {
                     setShowTotpEnroll(false);
                     loadMFAFactors();
                   }}
                 />
               </div>
             )}
           </div>

           <hr />

           <div className="w-full space-y-2">
             <Label className='gap-1'>Passkeys</Label>
             <div className="mt-2">
               <MFAPasskeyEnroll showSkip={false} />
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
