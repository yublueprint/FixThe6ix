'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DangerZone({ user }: { user: any }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    try {
      // NOTE: For full deletion, you'd want an API endpoint that deletes from Prisma and Supabase Admin API.
      // Currently, just deactivating or logging out.
      toast.info("Account deletion requested. Please contact an admin.")
      // await supabase.auth.signOut()
      // router.push("/login")
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      {/* Vertical Tabs List */}
      <div className='flex flex-col space-y-1'>
        <h3 className='font-semibold'>Danger Zone</h3>
        <p className='text-muted-foreground text-sm'>
          Delete your account permanently. This action will remove all your data and cannot be undone{' '}
          <a href='#' className='text-card-foreground font-medium hover:underline'>
            Learn more
          </a>
        </p>
      </div>

      {/* Content */}
      <div className='space-y-6 lg:col-span-2'>
        <Card>
          <CardContent>
            <div className='flex justify-between gap-4 max-lg:flex-col lg:items-center'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium'>Delete account</h3>
                <p className='text-muted-foreground text-sm'>
                  Delete your account permanently. This action will remove all your data and cannot be undone.
                </p>
              </div>
              <Dialog>
                <DialogTrigger render={
                  <Button
                    variant='destructive'
                    className='max-lg:w-full'
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className='mr-2 size-4' />
                    Delete
                  </Button>
                } />
                <DialogContent className='sm:max-w-md'>
                  <DialogHeader className='space-y-2'>
                    <DialogTitle>Delete account</DialogTitle>
                    <div className='text-muted-foreground text-sm'>
                      Delete your account permanently. This action will remove all your data and cannot be undone. Are you absolutely sure?
                    </div>
                  </DialogHeader>
                  <div className='flex flex-col-reverse gap-4 sm:flex-row sm:justify-end mt-4'>
                    <DialogClose render={<Button variant='outline'>Cancel</Button>} />
                    <Button variant='destructive' onClick={handleDelete} loading={loading} loadingText="Deleting...">
                      Delete Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
