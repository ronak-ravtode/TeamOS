import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users2,
  Plus,
  Trash2,
  UserPlus,
  Calendar,
  AlertTriangle,
  UserMinus,
  Settings,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { TeamSummary, WorkspaceMemberSummary } from '@teamos/shared';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Avatar } from '../../components/ui/Avatar';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(60),
  description: z.string().max(300).optional(),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

export const TeamsPage: React.FC = () => {
  const { activeWorkspace, canManage } = useWorkspace();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamSummary | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<TeamSummary | null>(null);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');

  // Fetch teams
  const { data: teams = [], isLoading } = useQuery<TeamSummary[]>({
    queryKey: ['workspace-teams', activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const res = await apiClient.get<TeamSummary[]>(`/workspaces/${activeWorkspace.id}/teams`);
      return res.data;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Fetch workspace members for adding to team
  const { data: workspaceMembers = [] } = useQuery<WorkspaceMemberSummary[]>({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get<WorkspaceMemberSummary[]>(
        `/workspaces/${activeWorkspace?.id}/members`,
      );
      return res.data;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Create Team form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
  });

  const createTeamMutation = useMutation({
    mutationFn: async (data: CreateTeamValues) => {
      return apiClient.post(`/workspaces/${activeWorkspace?.id}/teams`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-teams', activeWorkspace?.id] });
      reset();
      setIsCreateOpen(false);
    },
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      return apiClient.delete(`/workspaces/${activeWorkspace?.id}/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-teams', activeWorkspace?.id] });
      setTeamToDelete(null);
      setSelectedTeam(null);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return apiClient.post(`/workspaces/${activeWorkspace?.id}/teams/${teamId}/members`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-teams', activeWorkspace?.id] });
      setSelectedUserIdToAdd('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      return apiClient.delete(`/workspaces/${activeWorkspace?.id}/teams/${teamId}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-teams', activeWorkspace?.id] });
    },
  });

  // When selectedTeam changes or data refreshes, keep selectedTeam updated
  const activeSelectedTeam = teams.find((t) => t.id === selectedTeam?.id) || selectedTeam;

  const eligibleMembersToAdd = workspaceMembers.filter(
    (wm) => !activeSelectedTeam?.members.some((tm) => tm.userId === wm.userId),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Teams</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize members into functional teams (Engineering, Product, Marketing) to assign projects.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Team
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading workspace teams..." />
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users2 className="w-8 h-8 text-brand-600" />}
          title="No teams created yet"
          description="Group members into functional departments to streamline task assignment and ownership."
          actionLabel={canManage ? 'Create Team' : undefined}
          onAction={canManage ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              onClick={() => setSelectedTeam(team)}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-semibold text-slate-900">{team.name}</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {team.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {team.members.slice(0, 4).map((m) => (
                    <Avatar
                      key={m.id}
                      name={m.user.name}
                      size="xs"
                      className="ring-2 ring-white"
                    />
                  ))}
                  {team.memberCount > 4 && (
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium flex items-center justify-center ring-2 ring-white">
                      +{team.memberCount - 4}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-medium text-brand-600 hover:text-brand-700">
                  Manage Team &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Functional Team"
        description="Organize workspace users into functional units."
      >
        <form
          onSubmit={handleSubmit((data) => createTeamMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Team Name"
            placeholder="e.g. Engineering or Growth"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-colors"
              placeholder="Team mission and responsibilities..."
              {...register('description')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Team Details & Members Modal */}
      {activeSelectedTeam && (
        <Modal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          title={activeSelectedTeam.name}
          description={activeSelectedTeam.description || 'Functional team'}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Add Team Member Section (for Admins) */}
            {canManage && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide block">
                  Add Member to Team
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedUserIdToAdd}
                    onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="">Select workspace member...</option>
                    {eligibleMembersToAdd.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user.name} ({m.user.email})
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!selectedUserIdToAdd}
                    onClick={() =>
                      addMemberMutation.mutate({
                        teamId: activeSelectedTeam.id,
                        userId: selectedUserIdToAdd,
                      })
                    }
                    isLoading={addMemberMutation.isPending}
                    icon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {/* Current Members List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide block">
                Team Members ({activeSelectedTeam.members.length})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {activeSelectedTeam.members.map((member) => (
                  <div key={member.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={member.user.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{member.user.name}</p>
                        <p className="text-[10px] text-slate-500">{member.user.email}</p>
                      </div>
                    </div>

                    {canManage && (
                      <button
                        onClick={() =>
                          removeMemberMutation.mutate({
                            teamId: activeSelectedTeam.id,
                            userId: member.userId,
                          })
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove from team"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {activeSelectedTeam.members.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 italic">
                    No members in this team yet.
                  </div>
                )}
              </div>
            </div>

            {/* Footer with Delete Team action */}
            {canManage && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setTeamToDelete(activeSelectedTeam)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Team</span>
                </button>
                <Button size="sm" variant="outline" onClick={() => setSelectedTeam(null)}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Team Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={() => teamToDelete && deleteTeamMutation.mutate(teamToDelete.id)}
        title="Delete Team"
        message={`Are you sure you want to delete "${teamToDelete?.name}"? Deleting a team will not delete its users, tasks, or projects.`}
        confirmLabel="Delete Team"
        isLoading={deleteTeamMutation.isPending}
      />
    </div>
  );
};

