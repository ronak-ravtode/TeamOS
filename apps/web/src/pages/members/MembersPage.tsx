import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserCheck,
  UserPlus,
  Trash2,
  Shield,
  ShieldAlert,
  Calendar,
  Users2,
  MoreVertical,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { WorkspaceMemberSummary, WorkspaceRole } from '@teamos/shared';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Avatar } from '../../components/ui/Avatar';
import { RoleBadge } from '../../components/ui/Badge';

const addMemberSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
});

type AddMemberValues = z.infer<typeof addMemberSchema>;

export const MembersPage: React.FC = () => {
  const { user } = useAuth();
  const { activeWorkspace, isOwner, isAdmin, canManage } = useWorkspace();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberSummary | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery<WorkspaceMemberSummary[]>({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const res = await apiClient.get<WorkspaceMemberSummary[]>(
        `/workspaces/${activeWorkspace.id}/members`,
      );
      return res.data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberValues) => {
      return apiClient.post(`/workspaces/${activeWorkspace?.id}/members`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspace?.id] });
      reset();
      setIsAddOpen(false);
      setAddError(null);
    },
    onError: (err: any) => {
      setAddError(
        err.response?.data?.message ||
          'Failed to add member. Please verify the user has registered an account.',
      );
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: WorkspaceRole }) => {
      return apiClient.patch(
        `/workspaces/${activeWorkspace?.id}/members/${memberId}`,
        { role },
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspace?.id] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return apiClient.delete(`/workspaces/${activeWorkspace?.id}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspace?.id] });
      setMemberToRemove(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Members</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage who has access to {activeWorkspace?.name} and their assigned permissions.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setAddError(null);
              setIsAddOpen(true);
            }}
            icon={<UserPlus className="w-4 h-4" />}
          >
            Add Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading workspace members..." />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Workspace Role</th>
                  <th className="py-3 px-4">Assigned Teams</th>
                  <th className="py-3 px-4">Joined Date</th>
                  {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isCurrent = member.userId === user?.id;
                  const isMemberOwner = member.role === WorkspaceRole.OWNER;
                  const canAlterThisMember =
                    canManage && (!isMemberOwner || isOwner) && !isCurrent;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.user.name} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900">
                                {member.user.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block">
                              {member.user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {canAlterThisMember && isOwner ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                memberId: member.id,
                                role: e.target.value as WorkspaceRole,
                              })
                            }
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800"
                          >
                            <option value={WorkspaceRole.MEMBER}>Member</option>
                            <option value={WorkspaceRole.ADMIN}>Admin</option>
                            <option value={WorkspaceRole.OWNER}>Owner</option>
                          </select>
                        ) : canAlterThisMember && isAdmin && !isMemberOwner ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateRoleMutation.mutate({
                                memberId: member.id,
                                role: e.target.value as WorkspaceRole,
                              })
                            }
                            className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800"
                          >
                            <option value={WorkspaceRole.MEMBER}>Member</option>
                            <option value={WorkspaceRole.ADMIN}>Admin</option>
                          </select>
                        ) : (
                          <RoleBadge role={member.role} />
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {member.teams.map((t) => (
                            <span
                              key={t.id}
                              className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium"
                            >
                              {t.name}
                            </span>
                          ))}
                          {member.teams.length === 0 && (
                            <span className="text-slate-400 italic text-[11px]">No teams</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(member.joinedAt).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {canManage && (
                        <td className="py-3.5 px-4 text-right">
                          {canAlterThisMember && (
                            <button
                              onClick={() => setMemberToRemove(member)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              title="Remove from workspace"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add or Invite Workspace Member"
        description="Add a teammate by email. If they don't have an account yet, one will be created automatically."
      >
        <form
          onSubmit={handleSubmit((data) => addMemberMutation.mutate(data))}
          className="space-y-4"
        >
          {addError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{addError}</span>
            </div>
          )}

          <Input
            label="Full Name (Optional)"
            placeholder="e.g. Alex Morgan"
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="User Email Address"
            type="email"
            placeholder="colleague@company.com"
            error={errors.email?.message}
            helperText="Enter any email address. The member will be added to this workspace immediately."
            {...register('email')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Assigned Role
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
              {...register('role')}
            >
              <option value={WorkspaceRole.MEMBER}>Member (Standard operational access)</option>
              <option value={WorkspaceRole.ADMIN}>Admin (Can manage projects, teams & members)</option>
              {isOwner && <option value={WorkspaceRole.OWNER}>Owner (Full access)</option>}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Add to Workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={() => memberToRemove && removeMemberMutation.mutate(memberToRemove.id)}
        title="Remove Member from Workspace"
        message={`Are you sure you want to remove ${memberToRemove?.user.name} (${memberToRemove?.user.email}) from this workspace? Their task assignments in this workspace will be unassigned, but historical comments and records will be preserved.`}
        confirmLabel="Remove Member"
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
};

