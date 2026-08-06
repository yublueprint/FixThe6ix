import { Separator } from '@/components/ui/separator'

import PersonalInfo from '@/components/shadcn-studio/blocks/account-settings-01/content/personal-info'
import SecuritySettings from '@/components/shadcn-studio/blocks/account-settings-01/content/security-settings'
import MfaSettings from '@/components/shadcn-studio/blocks/account-settings-01/content/mfa-settings'
import DangerZone from '@/components/shadcn-studio/blocks/account-settings-01/content/danger-zone'

export default function UserGeneral({ user, role, roleRequest, onRefresh }: { user: any, role: string, roleRequest: boolean, onRefresh: () => void }) {
  return (
    <section className='py-3'>
      <div className='mx-auto max-w-7xl'>
        <PersonalInfo user={user} role={role} roleRequest={roleRequest} onRefresh={onRefresh} />
        <Separator className='my-10' />
        <SecuritySettings user={user} />
        <Separator className='my-10' />
        <MfaSettings user={user} />
        <Separator className='my-10' />
        <DangerZone user={user} />
      </div>
    </section>
  )
}
