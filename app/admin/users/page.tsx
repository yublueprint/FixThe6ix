"use client";

import { useEffect, useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogMedia } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon, PlusSignIcon, Cancel01Icon, Edit01Icon, Delete01Icon, Link01Icon, MoreHorizontalCircle01Icon, Search01Icon, ArrowDown01Icon, ArrowUp01Icon, Sorting01Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "VOLUNTEER"];
const STATUS_OPTIONS = ["ACTIVE", "INVITED"];
const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];


function formatShortDateTime(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${year}-${month}-${day}, ${time}`;
}

function SortIcon({ field, sortField, sortDirection }: {
  field: string; sortField: string | null; sortDirection: "asc" | "desc"
}) {
  if (sortField !== field) return <HugeiconsIcon icon={Sorting01Icon} strokeWidth={2} className="ml-1 size-3.5 text-muted-foreground/50" />
  if (sortDirection === "asc") return <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
  return <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="ml-1 size-3.5 text-foreground" />
}

export default function AdminUsersPage() {
  const { data, error, mutate: mutateUsers } = useSWR<any>("/api/admin/users", fetcher);
  const loading = !data && !error;
  const users: any[] = data?.users || [];
  const currentUserRole = data?.currentUserRole || "VOLUNTEER";
  const isSuperOrYU = currentUserRole === "SUPER_ADMIN" || currentUserRole === "YUBLUEPRINT";

  const [activeTab, setActiveTab] = useState<string>("fixthe6ix");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Filters & Search
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [roleSearch, setRoleSearch] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  function handleSort(field: string) {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  // Invite State
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Edit User State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("VOLUNTEER");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  // View User State
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);

  // Single Delete User State
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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

  const fixthe6ixCount = users.filter(u => u.role !== "YUBLUEPRINT").length;
  const yublueprintCount = users.filter(u => u.role === "YUBLUEPRINT").length;
  const currentTabTotal = (!isSuperOrYU || activeTab === "fixthe6ix") ? fixthe6ixCount : yublueprintCount;

  const currentRoleOptions = useMemo(() => {
    if (!isSuperOrYU || activeTab === "fixthe6ix") {
      return ["SUPER_ADMIN", "ADMIN", "VOLUNTEER"];
    }
    return ["YUBLUEPRINT"];
  }, [isSuperOrYU, activeTab]);

  const filteredRoleFilterOptions = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return currentRoleOptions;
    return currentRoleOptions.filter(r => r.toLowerCase().includes(q));
  }, [roleSearch, currentRoleOptions]);

  const filteredStatusFilterOptions = useMemo(() => {
    const q = statusSearch.trim().toLowerCase();
    if (!q) return STATUS_OPTIONS;
    return STATUS_OPTIONS.filter(s => s.toLowerCase().includes(q));
  }, [statusSearch]);

  const filteredUsers = useMemo(() => {
    let list = [...users];

    // Filter by tab: FixThe6ix (SUPER_ADMIN, ADMIN, VOLUNTEER) vs YUBlueprint
    if (!isSuperOrYU || activeTab === "fixthe6ix") {
      list = list.filter(u => u.role !== "YUBLUEPRINT");
    } else if (activeTab === "yublueprint") {
      list = list.filter(u => u.role === "YUBLUEPRINT");
    }

    if (selectedRoles.length > 0) {
      list = list.filter(u => selectedRoles.includes(u.role));
    }
    if (selectedStatuses.length > 0) {
      list = list.filter(u => selectedStatuses.includes(u.status));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q)) ||
        (u.status && u.status.toLowerCase().includes(q)) ||
        (u.roleRequest && "requested admin".includes(q))
      );
    }
    if (sortField) {
      list.sort((a, b) => {
        let va = "";
        let vb = "";
        if (sortField === "name") {
          va = (a.name || a.email || "").toLowerCase();
          vb = (b.name || b.email || "").toLowerCase();
        } else if (sortField === "role") {
          va = (a.role || "").toLowerCase();
          vb = (b.role || "").toLowerCase();
        } else if (sortField === "status") {
          va = (a.status || "").toLowerCase();
          vb = (b.status || "").toLowerCase();
        }
        const cmp = va.localeCompare(vb);
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }
    return list;
  }, [users, isSuperOrYU, activeTab, selectedRoles, selectedStatuses, searchQuery, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const paginatedUsers = useMemo(() => {
    const start = Math.max(0, safePageIndex) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, safePageIndex, pageSize]);

  useEffect(() => {
    setPageIndex(0);
    setSelectedRows([]);
  }, [searchQuery, selectedRoles, selectedStatuses, pageSize, activeTab]);

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

  async function handleDeleteUser() {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success(`Deleted member ${userToDelete.name || userToDelete.email}`);
        setShowDeleteUserDialog(false);
        setUserToDelete(null);
        mutateUsers();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the user");
    } finally {
      setDeletingUser(false);
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

  const selectedUsers = useMemo(() => {
    return users.filter(u => selectedRows.includes(u.id));
  }, [users, selectedRows]);

  async function handleBulkDeleteUsers() {
    if (selectedRows.length === 0) return;
    setBulkDeleting(true);
    try {
      const results = await Promise.all(
        selectedUsers.map((u) => fetch(`/api/admin/users/${u.id}`, { method: "DELETE" }))
      );
      const allOk = results.every(r => r.ok);
      if (allOk) {
        toast.success(`Deleted ${selectedRows.length} member${selectedRows.length > 1 ? 's' : ''}`);
      } else {
        toast.error("Some members could not be deleted");
      }
      setSelectedRows([]);
      setShowBulkDeleteDialog(false);
      await mutateUsers();
    } catch (e) {
      toast.error("An error occurred during deletion");
    } finally {
      setBulkDeleting(false);
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
        <SiteHeader title="User Management" />
        
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Tabs (Only visible to Super Admin and YUBlueprint) */}
            {isSuperOrYU && (
              <Tabs
                value={activeTab}
                onValueChange={(val) => {
                  setActiveTab(val);
                  setPageIndex(0);
                  setSelectedRoles([]);
                  setSelectedStatuses([]);
                  setSelectedRows([]);
                }}
              >
                <TabsList className="bg-muted rounded-lg p-1 h-auto flex-wrap">
                  <TabsTrigger value="fixthe6ix" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                    FixThe6ix
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{fixthe6ixCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="yublueprint" className="rounded-md text-xs px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm cursor-pointer">
                    YUBlueprint
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4 bg-muted-foreground/10">{yublueprintCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            {/* ── User Management Table Card ── */}
            <div className="border border-border rounded-[12px] overflow-hidden bg-card shadow-sm">
              
              {/* Card header + filters + Invite action */}
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {(!isSuperOrYU || activeTab === "fixthe6ix") ? "FixThe6ix Team" : "YUBlueprint Team"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(!isSuperOrYU || activeTab === "fixthe6ix") ? "Manage team members, roles, and pending invitations" : "Developers and technical contributors from YUBlueprint"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="rounded-full text-xs font-medium text-muted-foreground px-2.5 py-0.5 border-border bg-muted/40">{filteredUsers.length} of {currentTabTotal} members</Badge>
                    <Button onClick={() => setShowInviteDialog(true)} size="sm" className="h-8 min-w-[136px] rounded-[6px] text-xs font-medium gap-1.5 cursor-pointer justify-center">
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-3.5" />
                      Invite User
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  {/* Left: Role & Status Filters */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Multi-select Role Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-medium gap-1.5 min-w-44 justify-between border-border bg-card hover:bg-muted">
                          <span className="truncate">
                            {selectedRoles.length === 0
                              ? "All Roles"
                              : selectedRoles.length === 1
                              ? selectedRoles[0]
                              : `${selectedRoles.length} Roles Selected`}
                          </span>
                          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                        </Button>
                      } />
                      <DropdownMenuContent align="start" className="w-56 p-2 space-y-1">
                        <div className="relative mb-1">
                          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="Search roles..."
                            value={roleSearch}
                            onChange={e => setRoleSearch(e.target.value)}
                            className="h-7 pl-7 pr-2 text-xs rounded-[5px]"
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center justify-between px-1 py-1 text-[11px] text-muted-foreground border-b border-border mb-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedRoles(currentRoleOptions);
                            }}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          {selectedRoles.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedRoles([]);
                              }}
                              className="hover:underline cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
                          {filteredRoleFilterOptions.length > 0 ? (
                            filteredRoleFilterOptions.map(role => {
                              const isChecked = selectedRoles.includes(role);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={role}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedRoles(prev => [...prev, role]);
                                    } else {
                                      setSelectedRoles(prev => prev.filter(r => r !== role));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-xs cursor-pointer py-1.5"
                                >
                                  {role}
                                </DropdownMenuCheckboxItem>
                              );
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">No roles found</p>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Multi-select Status Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 rounded-[6px] text-xs font-medium gap-1.5 min-w-44 justify-between border-border bg-card hover:bg-muted">
                          <span className="truncate">
                            {selectedStatuses.length === 0
                              ? "All Statuses"
                              : selectedStatuses.length === 1
                              ? selectedStatuses[0]
                              : `${selectedStatuses.length} Statuses Selected`}
                          </span>
                          <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground shrink-0 ml-1" />
                        </Button>
                      } />
                      <DropdownMenuContent align="start" className="w-56 p-2 space-y-1">
                        <div className="relative mb-1">
                          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                          <Input
                            placeholder="Search statuses..."
                            value={statusSearch}
                            onChange={e => setStatusSearch(e.target.value)}
                            className="h-7 pl-7 pr-2 text-xs rounded-[5px]"
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex items-center justify-between px-1 py-1 text-[11px] text-muted-foreground border-b border-border mb-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedStatuses(STATUS_OPTIONS);
                            }}
                            className="text-primary hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          {selectedStatuses.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedStatuses([]);
                              }}
                              className="hover:underline cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 [scrollbar-width:thin] [scrollbar-color:var(--border)_transparent]">
                          {filteredStatusFilterOptions.length > 0 ? (
                            filteredStatusFilterOptions.map(status => {
                              const isChecked = selectedStatuses.includes(status);
                              return (
                                <DropdownMenuCheckboxItem
                                  key={status}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedStatuses(prev => [...prev, status]);
                                    } else {
                                      setSelectedStatuses(prev => prev.filter(s => s !== status));
                                    }
                                  }}
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-xs cursor-pointer py-1.5"
                                >
                                  {status}
                                </DropdownMenuCheckboxItem>
                              );
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-2">No statuses found</p>
                          )}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Middle: Search Input */}
                  <div className="relative">
                    <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search table"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-sm rounded-[6px] w-80 sm:w-96 md:w-[420px]"
                    />
                  </div>

                  {/* Right: Delete Selected Button */}
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={selectedRows.length === 0}
                      onClick={() => setShowBulkDeleteDialog(true)}
                      className="h-8 min-w-[136px] rounded-[6px] text-xs font-medium gap-1.5 bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer justify-center"
                    >
                      <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3.5" />
                      Delete Selected
                    </Button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-background">
                <Table className="bg-background">
                  <TableHeader className="bg-muted/50 dark:bg-sidebar">
                    <TableRow className="bg-muted/50 dark:bg-sidebar hover:bg-muted/50 dark:hover:bg-sidebar border-border">
                      <TableHead className="w-12 pl-6 py-3">
                        <Checkbox 
                          checked={selectedRows.length === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={(c) => setSelectedRows(c ? paginatedUsers.map(u => u.id) : [])}
                        />
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("name")}>
                        <div className="flex items-center">
                          Members
                          <SortIcon field="name" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("role")}>
                        <div className="flex items-center">
                          Role
                          <SortIcon field="role" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 cursor-pointer select-none hover:text-foreground" onClick={() => handleSort("status")}>
                        <div className="flex items-center">
                          Status
                          <SortIcon field="status" sortField={sortField} sortDirection={sortDirection} />
                        </div>
                      </TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground py-3 pr-6 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx} className="border-border">
                          <TableCell className="pl-6 py-3"><Skeleton className="h-4 w-4 rounded-sm" /></TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                              <div className="flex flex-col gap-1 w-full">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-40" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="py-3"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                          <TableCell className="pr-6 py-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedUsers.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">No members match your search or filters.</TableCell></TableRow>
                    ) : paginatedUsers.map(user => (
                      <TableRow key={user.id} className={`${user.roleRequest ? "bg-amber-50/50" : ""} hover:bg-muted/50 border-border`}>
                        <TableCell className="pl-6 align-middle py-3">
                          <Checkbox 
                            checked={selectedRows.includes(user.id)}
                            onCheckedChange={(c) => {
                              setSelectedRows(prev => c ? [...prev, user.id] : prev.filter(id => id !== user.id))
                            }}
                          />
                        </TableCell>
                        <TableCell className="align-middle py-3">
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
                        <TableCell className="align-middle py-3">
                          <span className="inline-flex items-center text-xs font-medium text-foreground">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle py-3">
                          {user.status === 'INVITED' ? (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 font-medium">Pending</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 font-medium">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-6 align-middle text-right py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* View User Details (Eye) */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => {
                                setViewingUser(user);
                                setShowViewUserDialog(true);
                              }}
                              title="View user details"
                            >
                              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-4" />
                              <span className="sr-only">View user</span>
                            </Button>

                            {/* Copy Invite Link (only for pending invitees) */}
                            {user.status === 'INVITED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => copyUserInviteLink(user.email)}
                                title="Copy invite link"
                              >
                                <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="size-4" />
                                <span className="sr-only">Copy invite link</span>
                              </Button>
                            )}

                            {/* Edit User (Pencil) */}
                            {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'YUBLUEPRINT' || (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => handleEditClick(user)}
                                title="Edit user"
                              >
                                <HugeiconsIcon icon={Edit01Icon} strokeWidth={2} className="size-4" />
                                <span className="sr-only">Edit user</span>
                              </Button>
                            )}

                            {/* Delete User (Red Trash) */}
                            {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'YUBLUEPRINT' || (currentUserRole === 'ADMIN' && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 cursor-pointer"
                                onClick={() => {
                                  setUserToDelete(user);
                                  setShowDeleteUserDialog(true);
                                }}
                                title="Delete user"
                              >
                                <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-4 text-red-500" />
                                <span className="sr-only">Delete user</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-t border-border bg-card">
                <p className="text-xs text-muted-foreground">
                  {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Rows per page</span>
                    <select
                      value={pageSize}
                      onChange={e => setPageSize(Number(e.target.value))}
                      className="border border-border rounded-[4px] px-1.5 py-0.5 text-xs text-foreground bg-background"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">Page {safePageIndex + 1} of {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPageIndex(0)}
                      disabled={safePageIndex === 0}
                      className="w-8 h-8 flex items-center justify-center rounded border border-border text-sm text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                      disabled={safePageIndex === 0}
                      className="w-8 h-8 flex items-center justify-center rounded border border-border text-sm text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                      disabled={safePageIndex >= totalPages - 1}
                      className="w-8 h-8 flex items-center justify-center rounded border border-border text-sm text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                    >
                      ›
                    </button>
                    <button
                      onClick={() => setPageIndex(totalPages - 1)}
                      disabled={safePageIndex >= totalPages - 1}
                      className="w-8 h-8 flex items-center justify-center rounded border border-border text-sm text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>

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
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'YUBLUEPRINT') && (
                      <>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="YUBLUEPRINT">YUBlueprint</SelectItem>
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

      {/* Single Delete User Alert Dialog */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {userToDelete?.name || userToDelete?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this member ({userToDelete?.role}) and revoke access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[6px]" disabled={deletingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deletingUser}
              className="rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingUser ? "Deleting…" : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View User Details Dialog */}
      <Dialog open={showViewUserDialog} onOpenChange={setShowViewUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              Detailed account information and member permissions.
            </DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="py-2 space-y-4">
              <div className="flex items-center gap-3.5 p-3 rounded-lg border border-border bg-muted/40">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={viewingUser.avatarUrl || viewingUser.image || ""} />
                  <AvatarFallback className="font-semibold text-base">
                    {viewingUser.name ? viewingUser.name.slice(0, 2).toUpperCase() : viewingUser.email?.slice(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{viewingUser.name || "No name set"}</h3>
                  <p className="text-xs text-muted-foreground truncate">{viewingUser.email}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`font-medium text-xs ${
                    viewingUser.status === 'INVITED'
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {viewingUser.status === 'INVITED' ? "Pending Invite" : "Active"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Role</span>
                  <span className="text-foreground font-semibold">{viewingUser.role}</span>
                </div>
                <div className="p-2.5 rounded-md border border-border bg-card">
                  <span className="text-muted-foreground block mb-1">Status</span>
                  <span className="text-foreground font-medium">
                    {viewingUser.status === 'INVITED' ? "Invited (Pending)" : "Active Member"}
                  </span>
                </div>
                {viewingUser.createdAt && (
                  <div className="p-2.5 rounded-md border border-border bg-card col-span-2">
                    <span className="text-muted-foreground block mb-1">Date Added / Joined</span>
                    <span className="text-foreground">{formatShortDateTime(viewingUser.createdAt)}</span>
                  </div>
                )}
                {viewingUser.roleRequest && (
                  <div className="p-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 col-span-2">
                    <span className="text-amber-800 dark:text-amber-300 font-medium block">
                      Admin Access Requested
                    </span>
                    <span className="text-muted-foreground text-[11px] block mt-0.5">
                      This user has requested an upgrade to the Admin role.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewUserDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Destructive Bulk Delete Users Alert Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {selectedRows.length} selected member{selectedRows.length > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the following {selectedRows.length} team member{selectedRows.length > 1 ? "s" : ""} and revoke access. This action cannot be undone:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="my-2 max-h-48 overflow-y-auto space-y-1.5 text-xs text-foreground/90 list-disc list-inside p-2.5 rounded-lg bg-muted/40 border border-border">
            {selectedUsers.map((u) => (
              <li key={u.id} className="truncate">
                <span className="font-semibold text-foreground">{u.name || u.email}</span> ({u.role}) — {u.status === "INVITED" ? "Pending Invite" : "Active Member"}
              </li>
            ))}
          </ul>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[6px]" disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBulkDeleteUsers}
              disabled={bulkDeleting}
              className="rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDeleting ? "Deleting…" : "Delete Selected"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite User Dialog component */}
      <InviteUserDialog 
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSuccess={() => mutateUsers()}
        currentUserRole={currentUserRole}
        defaultRole={activeTab === "yublueprint" ? "YUBLUEPRINT" : "VOLUNTEER"}
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
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'YUBLUEPRINT') && (
                      <>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                        <SelectItem value="YUBLUEPRINT">YUBlueprint</SelectItem>
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
