"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, PlusSignIcon, Cancel01Icon, Edit01Icon, Delete01Icon, Link01Icon, MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export default function AdminUsersPage() {
  const { data, error, mutate: mutateUsers } = useSWR<any>("/api/admin/users", fetcher);
  const loading = !data && !error;
  const users: any[] = data?.users || [];
  const currentUserRole = data?.currentUserRole || "VOLUNTEER";

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Invite State
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Edit User State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("VOLUNTEER");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [editInviteLink, setEditInviteLink] = useState("");
  const [loadingInviteLink, setLoadingInviteLink] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (error?.status === 403) {
      toast.error("You do not have permission to view this page.");
      router.push("/dashboard");
    } else if (error) {
      toast.error("Failed to load users");
    }
  }, [error, router]);

  function handlePromoteClick(user: any) {
    setSelectedUser(user);
    setShowConfirm(true);
  }

  async function grantAdminRole() {
    if (!selectedUser) return;
    
    // Additional confirmation as requested
    if (!window.confirm(`Are you absolutely sure you want to grant ADMIN access to ${selectedUser.name || selectedUser.email}?`)) {
      setShowConfirm(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "ADMIN" })
      });

      if (res.ok) {
        toast.success(`Admin role granted to ${selectedUser.name || selectedUser.email}`);
        setShowConfirm(false);
        mutateUsers();
      } else {
        toast.error("Failed to grant role");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  }

  async function cancelInvite(id: string) {
    if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Invitation cancelled.");
        mutateUsers();
      } else {
        toast.error("Failed to cancel invitation.");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  }

  function handleEditClick(user: any) {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditRole(user.role || "VOLUNTEER");
    setEditInviteLink("");
    setShowEditDialog(true);
    
    if (user.status === 'INVITED') {
      setLoadingInviteLink(true);
      fetch("/api/admin/users/invite/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      })
      .then(res => res.json())
      .then(data => {
        if (data.action_link) setEditInviteLink(data.action_link);
      })
      .finally(() => setLoadingInviteLink(false));
    }
  }

  async function copyUserInviteLink(email: string) {
    try {
      const res = await fetch("/api/admin/users/invite/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.action_link) {
        navigator.clipboard.writeText(data.action_link);
        toast.success("Invite link copied to clipboard!");
      } else {
        toast.error("Failed to generate link");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmail, role: editRole, name: editName })
      });
      if (res.ok) {
        toast.success("User updated successfully");
        setShowEditDialog(false);
        mutateUsers();
      } else {
        toast.error("Failed to update user");
      }
    } catch (error) {
      toast.error("An error occurred while updating the user.");
    } finally {
      setSavingEdit(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Link copied to clipboard!");
  }

  if (error?.status === 403) {
    return (
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="text-center">
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex justify-between items-center">
            <h1 className="text-lg font-semibold">User Management</h1>
            <Button onClick={() => setShowInviteDialog(true)} size="sm">
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="w-4 h-4 mr-1" />
              Invite User
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12 pl-6">
                      <Checkbox 
                        checked={selectedRows.length === users.length && users.length > 0}
                        onCheckedChange={(c) => setSelectedRows(c ? users.map(u => u.id) : [])}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3">Members</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3">Role</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-6"><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                            <div className="flex flex-col gap-1 w-full">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                        <TableCell className="pr-6 text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">No users found.</TableCell></TableRow>
                  ) : users.map(user => (
                    <TableRow key={user.id} className={`${user.roleRequest ? "bg-amber-50/50" : ""} hover:bg-muted/50`}>
                      <TableCell className="pl-6 align-middle">
                        <Checkbox 
                          checked={selectedRows.includes(user.id)}
                          onCheckedChange={(c) => {
                            setSelectedRows(prev => c ? [...prev, user.id] : prev.filter(id => id !== user.id))
                          }}
                        />
                      </TableCell>
                      <TableCell className="align-middle py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatarUrl || user.image || ""} />
                            <AvatarFallback>{user.name ? user.name.slice(0, 2).toUpperCase() : user.email?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-foreground text-sm font-medium">
                              {user.name || user.email}
                              {user.roleRequest && (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0 text-[10px] font-medium text-amber-800 ml-2">
                                  Requested Admin
                                </span>
                              )}
                            </span>
                            {user.name && <span className="text-muted-foreground text-xs">{user.email}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="inline-flex items-center text-xs font-medium text-foreground">
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        {user.status === 'INVITED' ? (
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 font-medium">Pending</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 font-medium">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(user)}>
                              <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                              <span className="sr-only">Edit User</span>
                            </Button>
                          )}
                          {user.status === 'INVITED' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground">
                                  <HugeiconsIcon icon={MoreHorizontalCircle01Icon} strokeWidth={2} className="size-4" />
                                  <span className="sr-only">More actions</span>
                                </Button>
                              } />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => copyUserInviteLink(user.email)}>
                                  <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                                  Copy Invite Link
                                </DropdownMenuItem>
                                {(currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 cursor-pointer"
                                      onClick={() => cancelInvite(user.id)}
                                    >
                                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                                      Cancel Invite
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </SidebarInset>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Admin Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to grant the Admin role to <strong>{selectedUser?.name || selectedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This user will have full access to manage inventory, edit gift cards, and manage other users.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={grantAdminRole}>Grant Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User / Invitation</DialogTitle>
            <DialogDescription>
              Update the user's email or role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="py-4 space-y-4">
              <Field>
                <FieldLabel>Display Name</FieldLabel>
                <Input 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  placeholder="John Doe"
                />
              </Field>
              <Field>
                <FieldLabel>Email Address</FieldLabel>
                <Input 
                  type="email" 
                  value={editEmail} 
                  disabled
                  className="cursor-not-allowed bg-muted"
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select value={editRole} onValueChange={(val) => setEditRole(val || "VOLUNTEER")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              {editingUser?.status === 'INVITED' && (
                <div className="pt-4 border-t border-[#e2e8f0] mt-4 space-y-3">
                  <Field>
                    <FieldLabel>Invite Link</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input 
                        readOnly 
                        value={loadingInviteLink ? "Loading link..." : editInviteLink} 
                        className="bg-muted font-mono text-sm"
                      />
                      <Button 
                        type="button" 
                        onClick={() => copyToClipboard(editInviteLink)}
                        disabled={!editInviteLink || loadingInviteLink}
                      >
                        Copy
                      </Button>
                    </div>
                  </Field>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog component */}
      <InviteUserDialog 
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={() => mutateUsers()}
        currentUserRole={currentUserRole}
      />

    </SidebarProvider>
  );
}

function InviteUserDialog({
  open,
  onOpenChange,
  onSuccess,
  currentUserRole = "VOLUNTEER",
  defaultRole = "VOLUNTEER"
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (user?: any) => void;
  currentUserRole?: string;
  defaultRole?: string;
}) {
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState(defaultRole);
  const [inviteCreateAccount, setInviteCreateAccount] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  const [generatedLink, setGeneratedLink] = useState("");
  const [showGeneratedLinkDialog, setShowGeneratedLinkDialog] = useState(false);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard");
    });
  }

  function handleOpenChange(newOpen: boolean) {
    onOpenChange(newOpen);
    if (!newOpen) {
      setInviteEmail("");
      setInviteDisplayName("");
      setInviteRole(defaultRole);
      setInviteCreateAccount(false);
    }
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);

    // Name-only volunteer (no Supabase auth)
    if (inviteRole === "VOLUNTEER" && !inviteCreateAccount) {
      if (!inviteDisplayName.trim()) {
        toast.error("Please enter a display name for the volunteer.");
        setInviting(false);
        return;
      }
      try {
        const res = await fetch("/api/volunteers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: inviteDisplayName.trim() })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success(`Volunteer "${data.name}" added successfully.`);
          handleOpenChange(false);
          if (onSuccess) onSuccess(data);
        } else {
          toast.error(data.error || "Failed to add volunteer");
        }
      } catch (error) {
        toast.error("An error occurred while adding the volunteer.");
      } finally {
        setInviting(false);
      }
      return;
    }

    // Full account invite (Supabase auth)
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, name: inviteDisplayName })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Invitation generated for ${inviteEmail}`);
        handleOpenChange(false);
        
        if (data.action_link) {
          setGeneratedLink(data.action_link);
          setShowGeneratedLinkDialog(true);
        }
        if (onSuccess) onSuccess(data.user);
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch (error) {
      toast.error("An error occurred while inviting the user.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              {inviteRole === "VOLUNTEER" && !inviteCreateAccount
                ? "Add a volunteer by name. No login account will be created."
                : "Send an email invitation. The user will be able to set their password and complete registration."
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit}>
            <div className="py-4 space-y-4">
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select value={inviteRole} onValueChange={(val) => {
                  setInviteRole(val || "VOLUNTEER");
                  if (val !== "VOLUNTEER") setInviteCreateAccount(true);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                    {currentUserRole === 'SUPER_ADMIN' && (
                      <>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </Field>

              {/* Animated account toggle for volunteers */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: inviteRole === "VOLUNTEER" ? "80px" : "0px",
                  opacity: inviteRole === "VOLUNTEER" ? 1 : 0,
                }}
              >
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Create login account</Label>
                    <p className="text-xs text-muted-foreground">Allow this volunteer to sign in</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={inviteCreateAccount}
                    onClick={() => setInviteCreateAccount(!inviteCreateAccount)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-xs transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                      inviteCreateAccount ? "bg-primary" : "bg-input"
                    }`}
                  >
                    <span
                      className={`pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        inviteCreateAccount ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <Field>
                <FieldLabel>{inviteRole === "VOLUNTEER" && !inviteCreateAccount ? "Display Name" : "Display Name (Optional)"}</FieldLabel>
                <Input 
                  value={inviteDisplayName} 
                  onChange={e => setInviteDisplayName(e.target.value)} 
                  placeholder="Jane Doe"
                  required={inviteRole === "VOLUNTEER" && !inviteCreateAccount}
                />
              </Field>

              {/* Animated email field — only shown when creating an account */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: (inviteRole !== "VOLUNTEER" || inviteCreateAccount) ? "100px" : "0px",
                  opacity: (inviteRole !== "VOLUNTEER" || inviteCreateAccount) ? 1 : 0,
                }}
              >
                <Field>
                  <FieldLabel>Email Address</FieldLabel>
                  <Input 
                    type="email" 
                    required={inviteRole !== "VOLUNTEER" || inviteCreateAccount}
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="volunteer@example.com"
                  />
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>
                {inviting
                  ? (inviteRole === "VOLUNTEER" && !inviteCreateAccount ? "Adding..." : "Sending...")
                  : (inviteRole === "VOLUNTEER" && !inviteCreateAccount ? "Add Volunteer" : "Send Invitation")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Generated Link Dialog */}
      <Dialog open={showGeneratedLinkDialog} onOpenChange={setShowGeneratedLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation Generated</DialogTitle>
            <DialogDescription>
              Share this secure link with the user to allow them to create their account and set a password.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Field>
              <FieldLabel>Invite Link</FieldLabel>
              <div className="flex items-center gap-2">
                <Input 
                  readOnly 
                  value={generatedLink} 
                  className="bg-muted font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(generatedLink)}>
                  Copy
                </Button>
              </div>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="default" onClick={() => setShowGeneratedLinkDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
