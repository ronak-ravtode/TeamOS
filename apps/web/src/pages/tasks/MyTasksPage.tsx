import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, Plus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { TaskSummary } from '@teamos/shared';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { TaskListView } from '../../components/tasks/TaskListView';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';

export const MyTasksPage: React.FC = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery<TaskSummary[]>({
    queryKey: ['workspace-tasks', activeWorkspace?.id, 'my-tasks', user?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return [];
      const res = await apiClient.get<TaskSummary[]>(
        `/workspaces/${activeWorkspace.id}/tasks?assigneeId=${user.id}`,
      );
      return res.data;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Tasks</h1>
          <p className="text-xs text-slate-500 mt-1">
            All tasks currently assigned to you across {activeWorkspace?.name}.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Task
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading your assigned tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-brand-600" />}
          title="No tasks assigned to you"
          description="You currently have no tasks assigned in this workspace. Create a task or pick up work from a project."
          actionLabel="Create Task"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <TaskListView tasks={tasks} />
      )}

      <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};

