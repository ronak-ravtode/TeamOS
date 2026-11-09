import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderKanban,
  Kanban,
  List,
  Plus,
  Calendar,
  Users2,
  Archive,
  RefreshCw,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { ProjectSummary, TaskSummary, ProjectStatus } from '@teamos/shared';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { KanbanBoard } from '../../components/tasks/KanbanBoard';
import { TaskListView } from '../../components/tasks/TaskListView';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeWorkspace, canManage } = useWorkspace();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [queryTaskId, setQueryTaskId] = useState<string | null>(null);

  useEffect(() => {
    const tid = searchParams.get('taskId');
    if (tid) {
      setQueryTaskId(tid);
    }
  }, [searchParams]);

  // Fetch Project details
  const { data: project, isLoading: isProjectLoading } = useQuery<
    ProjectSummary & { tasks: TaskSummary[]; team?: any }
  >({
    queryKey: ['project-detail', activeWorkspace?.id, projectId],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${activeWorkspace?.id}/projects/${projectId}`);
      return res.data;
    },
    enabled: !!activeWorkspace?.id && !!projectId,
  });

  // Archive / Reactivate project mutation
  const toggleArchiveMutation = useMutation({
    mutationFn: async (newStatus: ProjectStatus) => {
      return apiClient.patch(`/workspaces/${activeWorkspace?.id}/projects/${projectId}`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-detail', activeWorkspace?.id, projectId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] });
    },
  });

  if (isProjectLoading || !project) {
    return <LoadingSpinner message="Loading project workspace..." />;
  }

  const isArchived = project.status === ProjectStatus.ARCHIVED;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/projects" className="hover:text-slate-900 flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Projects</span>
        </Link>
        <span>/</span>
        <span className="font-mono font-semibold text-slate-700">{project.key}</span>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
                {project.key}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              {isArchived && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>Archived (Read Only)</span>
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-1">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
              {project.team && (
                <div className="flex items-center gap-1.5">
                  <Users2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Team: {project.team.name}</span>
                </div>
              )}
              {project.targetDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target: {new Date(project.targetDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toggleArchiveMutation.mutate(
                    isArchived ? ProjectStatus.ACTIVE : ProjectStatus.ARCHIVED,
                  )
                }
                isLoading={toggleArchiveMutation.isPending}
                icon={isArchived ? <RefreshCw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              >
                {isArchived ? 'Reactivate Project' : 'Archive Project'}
              </Button>
            )}

            {(!isArchived || canManage) && (
              <Button
                size="sm"
                onClick={() => setIsCreateTaskOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                New Task
              </Button>
            )}
          </div>
        </div>

        {/* Progress Strip */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Overall Progress</span>
              <span className="font-semibold text-slate-800">{project.progressPercentage}%</span>
            </div>
            <ProgressBar progress={project.progressPercentage} />
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Tasks</span>
              <span className="font-bold text-slate-900">{project.taskCount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Completed</span>
              <span className="font-bold text-emerald-600">{project.completedTaskCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Board vs List */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'board'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Task List</span>
          </button>
        </div>
      </div>

      {/* Tasks View */}
      {viewMode === 'board' ? (
        <KanbanBoard
          tasks={project.tasks || []}
          projectId={project.id}
          isArchivedProject={isArchived && !canManage}
        />
      ) : (
        <TaskListView tasks={project.tasks || []} hideProjectColumn />
      )}

      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={project.id}
      />

      <TaskDetailModal
        taskId={queryTaskId}
        isOpen={!!queryTaskId}
        onClose={() => {
          setQueryTaskId(null);
          setSearchParams({});
        }}
      />
    </div>
  );
};

