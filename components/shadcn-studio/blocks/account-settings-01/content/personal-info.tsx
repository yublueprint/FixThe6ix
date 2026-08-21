'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HugeiconsIcon } from '@hugeicons/react'
import { Image01Icon, CloudUploadIcon, Delete02Icon } from '@hugeicons/core-free-icons'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function PersonalInfo({ user, role, roleRequest, onRefresh }: { user: any, role: string, roleRequest: boolean, onRefresh: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name || user?.name || "")
  const [loading, setLoading] = useState(false)
  const supabase = createClient();

  useEffect(() => {
    setDisplayName(user?.user_metadata?.full_name || user?.name || "");
  }, [user]);

  useEffect(() => {
    if (!file) {
      const t = window.setTimeout(() => setPreview(null), 0)
      return () => clearTimeout(t)
    }

    const url = URL.createObjectURL(file)
    const t = window.setTimeout(() => setPreview(url), 0)

    return () => {
      clearTimeout(t)
      URL.revokeObjectURL(url)
    }
  }, [file])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file')
      e.currentTarget.value = ''
      return
    }
    if (f.size > 10 * 1024 * 1024) { // Allow up to 10MB to be selected, it will be shrunk
      toast.error('File must be smaller than 10MB')
      e.currentTarget.value = ''
      return
    }
    setFile(f)
    setAvatarRemoved(false)
  }

  const openPicker = () => inputRef.current?.click()

  const remove = () => {
    setFile(null)
    setAvatarRemoved(true)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function resizeImage(file: File, maxWidth = 400, maxHeight = 400): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = () => reject(new Error('Image load error'));
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let avatarUrl = user?.user_metadata?.avatar_url;
    
    if (file && user?.id) {
      try {
        const resizedBlob = await resizeImage(file);
        const formData = new FormData();
        formData.append("file", resizedBlob, `${user.id}.jpg`);

        const uploadRes = await fetch(`/api/users/${user.id}`, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload image");
        }

        avatarUrl = uploadData.avatarUrl;
      } catch (err: any) {
        toast.error("Failed to upload avatar: " + err.message);
        setLoading(false);
        return;
      }
    } else if (avatarRemoved) {
      avatarUrl = null;
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: displayName,
        avatar_url: avatarUrl,
      }
    });

    if (!error && user?.id) {
      await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, image: avatarUrl })
      }).catch(() => {});
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully.");
      onRefresh();
    }
    setLoading(false);
  }

  async function requestAdminRole() {
    try {
      const res = await fetch(`/api/users/${user.id}/role-request`, { method: "POST" });
      if (res.ok) {
        toast.success("Admin role requested successfully.");
        onRefresh();
      } else {
        toast.error("Failed to request admin role.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    }
  }

  return (
    <div className='grid grid-cols-1 gap-10 lg:grid-cols-3'>
      <div className='flex flex-col space-y-1'>
        <h3 className='font-semibold'>Personal Information</h3>
        <p className='text-muted-foreground text-sm'>Manage your personal information and role.</p>
      </div>

      <div className='space-y-6 lg:col-span-2'>
        <form className='mx-auto' onSubmit={handleSave}>
          <div className='mb-6 w-full space-y-2'>
            <Label>Your Avatar</Label>
            <div className='flex items-center gap-4'>
              <div
                role='button'
                tabIndex={0}
                aria-label='Upload your avatar'
                onClick={openPicker}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPicker()
                  }
                }}
                className='flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed hover:opacity-95'
              >
                {preview || (!avatarRemoved && user?.user_metadata?.avatar_url) ? (
                  <img src={preview || user?.user_metadata?.avatar_url} alt='avatar preview' className='h-full w-full object-cover' />
                ) : (
                  <HugeiconsIcon icon={Image01Icon} strokeWidth={2} />
                )}
              </div>

              <div className='flex items-center gap-2'>
                <input ref={inputRef} type='file' accept='image/*' className='hidden' onChange={onSelect} />
                <Button type='button' variant='outline' onClick={openPicker} className='flex items-center gap-2'>
                  <HugeiconsIcon icon={CloudUploadIcon} strokeWidth={2} className="size-4" />
                  Upload avatar
                </Button>
                <Button type='button' variant='ghost' onClick={remove} disabled={!file} className='text-destructive!'>
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-4 text-red-500" />
                </Button>
              </div>
            </div>
            <p className='text-muted-foreground text-sm'>Pick a photo up to 10MB.</p>
          </div>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='displayName'>Display Name</Label>
              <Input id='displayName' value={displayName} onChange={e => setDisplayName(e.target.value)} required />
            </div>
            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input id='email' type='email' value={user?.email || ""} disabled className="cursor-not-allowed bg-muted" />
            </div>

            <div className='flex flex-col items-start gap-2'>
              <Label htmlFor='role'>Current Role</Label>
              <Input id='role' value={role} disabled className="cursor-not-allowed bg-muted" />
            </div>
            
            {role === "VOLUNTEER" && (
              <div className='flex flex-col items-start justify-end gap-2'>
                 <Button 
                    type="button" 
                    variant="secondary" 
                    className="w-full" 
                    onClick={requestAdminRole}
                    disabled={roleRequest}
                  >
                    {roleRequest ? "Admin Request Pending" : "Request Admin Role"}
                  </Button>
              </div>
            )}
          </div>
          
          <div className='flex justify-end mt-6'>
            <Button type='submit' className='max-sm:w-full' loading={loading} loadingText="Saving...">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
