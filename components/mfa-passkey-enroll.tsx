"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, Edit01Icon, MoreHorizontalCircle01Icon, FingerPrintIcon } from "@hugeicons/core-free-icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Props = {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
};

type PasskeyItem = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

export function MFAPasskeyEnroll({ onComplete, onSkip, showSkip = true }: Props) {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const supabase = createClient() as any; // passkey API is experimental

  useEffect(() => {
    loadPasskeys();
  }, []);

  async function loadPasskeys() {
    try {
      const { data } = await supabase.auth.passkey.list();
      setPasskeys(data || []);
    } catch (e) {
      // Passkeys may not be enabled — that's OK
    }
  }

  async function registerPasskey() {
    setRegistering(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        setError(error.message);
      } else {
        toast.success("Passkey registered!");
        loadPasskeys();
        onComplete?.();
      }
    } catch (e: any) {
      setError(e.message || "Passkey registration cancelled or failed.");
    }
    setRegistering(false);
  }

  async function deletePasskey(id: string) {
    if (!window.confirm("Remove this passkey? You won't be able to use it to sign in.")) return;
    try {
      await supabase.auth.passkey.delete({ passkeyId: id });
      toast.success("Passkey removed.");
      loadPasskeys();
    } catch (e: any) {
      toast.error(e.message || "Failed to remove passkey.");
    }
  }

  async function renamePasskey(id: string) {
    try {
      await supabase.auth.passkey.update({ passkeyId: id, friendlyName: editName });
      toast.success("Passkey renamed.");
      setEditingId(null);
      setEditName("");
      loadPasskeys();
    } catch (e: any) {
      toast.error(e.message || "Failed to rename passkey.");
    }
  }

  return (
    <div className="space-y-3">

        {passkeys.length > 0 && (
          <div className="space-y-4 mt-2">
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between p-4 border rounded-md bg-card text-card-foreground text-sm shadow-sm">
                {editingId === pk.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Passkey name"
                      className="h-7 text-xs"
                    />
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => renamePasskey(pk.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {pk.friendly_name || "Passkey"}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">Status: <span className="text-green-600 font-medium">Active</span></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { setEditingId(pk.id); setEditName(pk.friendly_name || ""); }}>
                        <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                        <span className="sr-only">Edit Name</span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                            <span className="sr-only">More actions</span>
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => deletePasskey(pk.id)}
                          >
                            <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className={passkeys.length > 0 ? "flex justify-end mt-4" : "flex justify-start mt-2"}>
          <Button
            type="button"
            variant="default"
            className="max-sm:w-full"
            onClick={registerPasskey}
            disabled={registering}
          >
            {registering ? "Waiting for device…" : passkeys.length > 0 ? "Register another passkey" : "Register a Passkey"}
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
