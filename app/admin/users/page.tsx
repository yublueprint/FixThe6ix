"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, PlusSignIcon, Cancel01Icon, Edit01Icon, Delete01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState("VOLUNTEER");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Invite State
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VOLUNTEER");
  const [inviting, setInviting] = useState(false);

  // Generated Link State
  const [generatedLink, setGeneratedLink] = useState("");
  const [showGeneratedLinkDialog, setShowGeneratedLinkDialog] = useState(false);

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
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        toast.error("You do not have permission to view this page.");
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      if (data.currentUserRole) {
        setCurrentUserRole(data.currentUserRole);
      }
    } catch (e) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

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
        fetchUsers();
      } else {
        toast.error("Failed to grant role");
      }
    } catch (e) {
      toast.error("An error occurred");
    }
  }

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, name: inviteDisplayName })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Invitation generated for ${inviteEmail}`);
        setShowInviteDialog(false);
        setInviteEmail("");
        setInviteDisplayName("");
        setInviteRole("VOLUNTEER");
        if (data.action_link) {
          setGeneratedLink(data.action_link);
          setShowGeneratedLinkDialog(true);
        }
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to send invite");
      }
    } catch (error) {
      toast.error("An error occurred while inviting the user.");
    } finally {
      setInviting(false);
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
        fetchUsers();
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
        fetchUsers();
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
                    <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-6 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading users...</TableCell></TableRow>
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
                            <AvatarImage src={user.image || ""} />
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
                      <TableCell className="pr-6 align-middle text-right">
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'INVITED' && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800 mr-2">
                              Invite Pending
                            </span>
                          )}
                          {user.status === 'INVITED' && (
                            <HugeiconsIcon
                              icon={Link01Icon}
                              strokeWidth={2}
                              className="size-4 text-muted-foreground hover:text-green-600 cursor-pointer"
                              onClick={() => copyUserInviteLink(user.email)}
                            />
                          )}
                          {(currentUserRole === 'SUPER_ADMIN' || (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) && (
                            <>
                              <HugeiconsIcon
                                icon={Edit01Icon}
                                strokeWidth={2}
                                className="size-4 text-muted-foreground hover:text-blue-500 cursor-pointer"
                                onClick={() => handleEditClick(user)}
                              />
                              {user.status === 'INVITED' && (
                                <HugeiconsIcon
                                  icon={Delete01Icon}
                                  strokeWidth={2}
                                  className="size-4 text-muted-foreground hover:text-red-500 cursor-pointer"
                                  onClick={() => cancelInvite(user.id)}
                                />
                              )}
                            </>
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

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an email invitation. The user will be able to set their password and complete registration.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteSubmit}>
            <div className="py-4 space-y-4">
              <Field>
                <FieldLabel>Display Name (Optional)</FieldLabel>
                <Input 
                  value={inviteDisplayName} 
                  onChange={e => setInviteDisplayName(e.target.value)} 
                  placeholder="Jane Doe"
                />
              </Field>
              <Field>
                <FieldLabel>Email Address</FieldLabel>
                <Input 
                  type="email" 
                  required 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  placeholder="volunteer@example.com"
                />
              </Field>
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "VOLUNTEER")}>
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
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

    </SidebarProvider>
  );
}
