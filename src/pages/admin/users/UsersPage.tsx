import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MailPlus, Search, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/admin/useAuditLog";
import type { AdminUser, AdminUsersResponse } from "@/types/admin";
const USERS_PER_PAGE = 10;
const DEFAULT_ROLE: AdminUser["role"] = "analyst";
const escapeIlike = (value: string) => value.replace(/[%_]/g, char => `\\${char}`);
const fetchUsers = async ({
  page,
  search
}: {
  page: number;
  search: string;
}): Promise<AdminUsersResponse> => {
  const from = page * USERS_PER_PAGE;
  const to = from + USERS_PER_PAGE - 1;
  let query = supabase.from("user_profiles").select("id, email, role, created_at, full_name", {
    count: "exact"
  }).order("created_at", {
    ascending: false
  }).range(from, to);
  if (search) {
    query = query.ilike("email", `%${escapeIlike(search)}%`);
  }
  const {
    data,
    error,
    count
  } = await query;
  if (error) {
    throw error;
  }
  const users = (data ?? []).map(item => ({
    id: item.id,
    email: item.email,
    role: item.role,
    created_at: item.created_at,
    full_name: (item as {
      full_name?: string | null;
    }).full_name ?? null
  }));
  return {
    users,
    total: count ?? 0
  };
};
const upsertInvite = async ({
  email,
  role
}: {
  email: string;
  role: AdminUser["role"];
}) => {
  const token = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const {
    error
  } = await supabase.from("admin_invites").upsert({
    email,
    role,
    token,
    status: "pending"
  }, {
    onConflict: "email"
  });
  if (error) {
    throw error;
  }
};
const updateUserRole = async (userId: string, role: AdminUser["role"]) => {
  const {
    error
  } = await supabase.from("user_profiles").update({
    role
  }).eq("id", userId);
  if (error) {
    throw error;
  }
};
const deleteUserProfile = async (userId: string) => {
  const {
    error
  } = await supabase.from("user_profiles").delete().eq("id", userId);
  if (error) {
    throw error;
  }
};
const UsersPage = () => {
  const queryClient = useQueryClient();
  const {
    profile
  } = useAuth();
  const {
    log
  } = useAuditLog();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [page, setPage] = useState(0);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminUser["role"]>(DEFAULT_ROLE);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const usersQuery = useQuery<AdminUsersResponse>({
    queryKey: ["admin", "users", {
      page,
      search: deferredSearch
    }],
    queryFn: () => fetchUsers({
      page,
      search: deferredSearch
    }),
    keepPreviousData: true
  });
  const createInviteMutation = useMutation<void, Error, {
    email: string;
    role: AdminUser["role"];
  }>({
    mutationFn: upsertInvite,
    onSuccess: async (_, variables) => {
      toast.success(`Invite sent to ${variables.email}`);
      await log("user_created", {
        email: variables.email,
        role: variables.role
      });
      setInviteEmail("");
      setInviteRole(DEFAULT_ROLE);
      setInviteOpen(false);
    },
    onError: error => {
      toast.error(`Failed to create invite: ${error.message}`);
    }
  });
  const updateRoleMutation = useMutation<void, Error, {
    userId: string;
    role: AdminUser["role"];
  }>({
    mutationFn: async ({
      userId,
      role
    }) => updateUserRole(userId, role),
    onMutate: async ({
      userId,
      role
    }) => {
      await queryClient.cancelQueries({
        queryKey: ["admin", "users"]
      });
      const previous = queryClient.getQueriesData<AdminUsersResponse>({
        queryKey: ["admin", "users"]
      });
      previous.forEach(([key, value]) => {
        if (!value) return;
        queryClient.setQueryData(key, {
          ...value,
          users: value.users.map(user => user.id === userId ? {
            ...user,
            role
          } : user)
        });
      });
      return {
        previous
      };
    },
    onError: (error, variables, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(`Failed to update role: ${error.message}`);
    },
    onSuccess: async (_, variables) => {
      toast.success("Role updated");
      await log("role_changed", {
        userId: variables.userId,
        role: variables.role
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "users"]
      });
    }
  });
  const deleteUserMutation = useMutation<void, Error, AdminUser>({
    mutationFn: async user => deleteUserProfile(user.id),
    onSuccess: async (data, user) => {
      toast.success(`Removed ${user.email}`);
      await log("user_deleted", {
        userId: user.id,
        email: user.email
      });
      await queryClient.invalidateQueries({
        queryKey: ["admin", "users"]
      });
      setUserToDelete(null);
    },
    onError: error => {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  });
  const totalUsers = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));
  const disableNext = page >= totalPages - 1;
  const handleInviteSubmit = () => {
    if (!inviteEmail) {
      toast.error("Email is required");
      return;
    }
    createInviteMutation.mutate({
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole
    });
  };
  const actions = <Button size="lg" onClick={() => setInviteOpen(true)} className="inline-flex items-center gap-2">
      <UserPlus className="h-4 w-4" />
      Invite user
    </Button>;
  const inviteDescription = "Send an invite email to onboard a new admin or analyst.";
  const rows = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data]);
  return <AdminLayout title="Users & Roles" description="Manage administrator and analyst access across the WinMix platform." breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Users"
  }]} actions={actions}>
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => {
            setSearch(event.target.value);
            setPage(0);
          }} placeholder="Search by email" className="h-11 pl-9" />
          </div>
          <p className="text-sm text-muted-foreground">
            {totalUsers} user{totalUsers === 1 ? "" : "s"}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="sr-only">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading ? <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Loading users…
                  </TableCell>
                </TableRow> : rows.length === 0 ? <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No users found. Try adjusting your search.
                  </TableCell>
                </TableRow> : rows.map(user => {
              const isSelf = user.id === profile?.id;
              const createdLabel = user.created_at ? format(new Date(user.created_at), "PP") : "—";
              return <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{user.email}</span>
                          {user.full_name ? <span className="text-xs text-muted-foreground">{user.full_name}</span> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={user.role} onValueChange={role => updateRoleMutation.mutate({
                    userId: user.id,
                    role: role as AdminUser["role"]
                  })} disabled={isSelf || updateRoleMutation.isPending}>
                          <SelectTrigger className="h-11 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="analyst">Analyst</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{createdLabel}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-11 w-11" disabled={isSelf || deleteUserMutation.isPending} onClick={() => setUserToDelete(user)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete user</span>
                        </Button>
                      </TableCell>
                    </TableRow>;
            })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-11" onClick={() => setPage(prev => Math.max(prev - 1, 0))} disabled={page === 0}>
              Previous
            </Button>
            <Button variant="outline" className="h-11" onClick={() => setPage(prev => disableNext ? prev : prev + 1)} disabled={disableNext}>
              Next
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailPlus className="h-4 w-4" />
              New invitation
            </DialogTitle>
            <DialogDescription>{inviteDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="invite-email">
                Email
              </label>
              <Input id="invite-email" type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} placeholder="analyst@winmix.ai" autoComplete="email" className="h-11" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="invite-role">
                Role
              </label>
              <Select value={inviteRole} onValueChange={value => setInviteRole(value as AdminUser["role"])}>
                <SelectTrigger id="invite-role" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="h-11" onClick={() => setInviteOpen(false)} disabled={createInviteMutation.isPending}>
              Cancel
            </Button>
            <Button className="h-11" onClick={handleInviteSubmit} disabled={createInviteMutation.isPending}>
              {createInviteMutation.isPending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={Boolean(userToDelete)} onOpenChange={open => {
      if (!open) {
        setUserToDelete(null);
      }
    }} title="Remove user" description={userToDelete ? <span>
              Are you sure you want to remove <span className="font-semibold">{userToDelete.email}</span>? This will revoke access immediately.
            </span> : ""} confirmLabel="Remove" cancelLabel="Cancel" destructive isConfirmLoading={deleteUserMutation.isPending} onConfirm={() => {
      if (userToDelete) {
        deleteUserMutation.mutate(userToDelete);
      }
    }} />
    </AdminLayout>;
};
export default UsersPage;