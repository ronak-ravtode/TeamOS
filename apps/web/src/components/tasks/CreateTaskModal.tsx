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
import { TaskStatus, TaskPriority, WorkspaceMemberSummary, ProjectSummary } from '@teamos/shared';

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(5000).optional(),
  projectId: z.string().min(1, 'Please select a project'),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assigneeId: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}

export const CreateTaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultStatus,
}) => {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Fetch workspace members for assignment dropdown
  const { data: members = [] } = useQuery<WorkspaceMemberSummary[]>({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${activeWorkspace?.id}/members`);
      return res.data;
    },
    enabled: isOpen && !!activeWorkspace?.id,
  });

  // Fetch active projects
  const { data: projects = [] } = useQuery<ProjectSummary[]>({
    queryKey: ['workspace-projects', activeWorkspace?.id, 'ACTIVE'],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${activeWorkspace?.id}/projects?status=ACTIVE`);
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
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      status: defaultStatus || TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      title: '',
      description: '',
    },
  });

  const onSubmit = async (data: TaskFormValues) => {
    try {
      await apiClient.post(`/workspaces/${activeWorkspace?.id}/tasks`, {
        title: data.title,
        description: data.description || undefined,
        projectId: data.projectId,
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId || undefined,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });

      reset();
      onClose();
    } catch (err: any) {
      setError('title', {
        message: err.response?.data?.message || 'Failed to create task',
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add an actionable unit of work to the project."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Design responsive navigation header"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Project
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              {...register('projectId')}
              defaultValue={defaultProjectId || ''}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
            {errors.projectId && (
              <p className="text-xs text-rose-600">{errors.projectId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Assignee
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              {...register('assigneeId')}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Status
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              {...register('status')}
              defaultValue={defaultStatus || TaskStatus.TODO}
            >
              <option value={TaskStatus.BACKLOG}>Backlog</option>
              <option value={TaskStatus.TODO}>To Do</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.IN_REVIEW}>In Review</option>
              <option value={TaskStatus.BLOCKED}>Blocked</option>
              <option value={TaskStatus.DONE}>Done</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Priority
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
              {...register('priority')}
              defaultValue={TaskPriority.MEDIUM}
            >
              <option value={TaskPriority.LOW}>Low</option>
              <option value={TaskPriority.MEDIUM}>Medium</option>
              <option value={TaskPriority.HIGH}>High</option>
              <option value={TaskPriority.URGENT}>Urgent</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" {...register('startDate')} />
          <Input label="Due Date" type="date" {...register('dueDate')} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Description
          </label>
          <textarea
            rows={4}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-colors"
            placeholder="Detailed requirements, acceptance criteria, or context..."
            {...register('description')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

