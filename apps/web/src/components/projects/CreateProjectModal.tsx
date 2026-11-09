import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { apiClient } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';
import { TeamSummary } from '@teamos/shared';

const projectSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    key: z
      .string()
      .min(2, 'Key must be at least 2 characters')
      .max(10, 'Key cannot exceed 10 characters')
      .regex(/^[A-Za-z0-9]+$/, 'Key must be alphanumeric'),
    description: z.string().max(500).optional(),
    teamId: z.string().optional(),
    startDate: z.string().optional(),
    targetDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.targetDate) {
        return new Date(data.startDate) <= new Date(data.targetDate);
      }
      return true;
    },
    {
      message: 'Start date cannot be after target completion date',
      path: ['targetDate'],
    },
  );

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export const CreateProjectModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery<TeamSummary[]>({
    queryKey: ['workspace-teams', activeWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${activeWorkspace?.id}/teams`);
      return res.data;
    },
    enabled: isOpen && !!activeWorkspace?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const res = await apiClient.post(`/workspaces/${activeWorkspace?.id}/projects`, {
        name: data.name,
        key: data.key.toUpperCase(),
        description: data.description || undefined,
        teamId: data.teamId || undefined,
        startDate: data.startDate || undefined,
        targetDate: data.targetDate || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-projects', activeWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard', activeWorkspace?.id] });
      reset();
      onClose();
      if (onSuccess) onSuccess(res.data.id);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('key', { message: 'Project key already exists in this workspace' });
      } else {
        setError('name', { message: err.response?.data?.message || 'Failed to create project' });
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Setup a new project container with its unique issue key."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Project Name"
          placeholder="e.g. Mobile Application Launch"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Project Key (Unique identifier)"
          placeholder="e.g. MOB or CRM"
          error={errors.key?.message}
          helperText="Short uppercase prefix used for all tasks in this project"
          {...register('key')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Associated Team (Optional)
          </label>
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
            {...register('teamId')}
          >
            <option value="">No team assigned</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Target Completion"
            type="date"
            error={errors.targetDate?.message}
            {...register('targetDate')}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-colors"
            placeholder="High-level goals and deliverables..."
            {...register('description')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

