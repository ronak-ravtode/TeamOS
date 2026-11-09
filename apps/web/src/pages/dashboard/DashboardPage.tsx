import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  ListTodo,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { DashboardMetrics, TaskSummary, ProjectSummary } from '@teamos/shared';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { TaskStatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';

export const DashboardPage: React.FC = () => {
  const { activeWorkspace, canManage } = useWorkspace();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const { data: metrics, isLoading, error } = useQuery<DashboardMetrics>({
    queryKey: ['workspace-dashboard', activeWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get<DashboardMetrics>(`/workspaces/${activeWorkspace!.id}/dashboard`);
      return res.data;
    },
    enabled: !!activeWorkspace?.id,
  });

  if (isLoading) {
    return <LoadingSpinner message="Calculating workspace statistics..." />;
  }

  if (!metrics || metrics.totalActiveProjects === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status of projects, task assignments, and progress.
          </p>
        </div>

        <EmptyState
          icon={<FolderKanban className="w-8 h-8 text-brand-600" />}
          title="Your workspace is ready"
          description="Create your first project to start organizing your team's work, tasks, and deliverables."
          actionLabel={canManage ? "Create Project" : undefined}
          onAction={canManage ? () => setIsCreateProjectOpen(true) : undefined}
        />

        <CreateProjectModal
          isOpen={isCreateProjectOpen}
          onClose={() => setIsCreateProjectOpen(false)}
        />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Projects',
      value: metrics.totalActiveProjects,
      icon: FolderKanban,
      color: 'text-brand-600',
      bgColor: 'bg-brand-50 border-brand-200',
    },
    {
      title: 'Total Tasks',
      value: metrics.totalTasks,
      icon: ListTodo,
      color: 'text-slate-700',
      bgColor: 'bg-slate-50 border-slate-200',
    },
    {
      title: 'In Progress',
      value: metrics.inProgressTasks,
      icon: Clock,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 border-sky-200',
    },
    {
      title: 'Completed',
      value: metrics.completedTasks,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Blocked Tasks',
      value: metrics.blockedTasks,
      icon: AlertOctagon,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 border-rose-200',
    },
    {
      title: 'Overdue Tasks',
      value: metrics.overdueTasksCount,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeWorkspace?.name} Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time project deliverables, assignment velocity, and blockers.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsCreateProjectOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg border ${card.bgColor}`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Overdue Tasks Alert (if any) */}
      {metrics.overdueTasks.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-amber-900 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Overdue Work Requiring Attention ({metrics.overdueTasks.length})</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {metrics.overdueTasks.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                to={`/projects/${task.projectId}?taskId=${task.id}`}
                className="p-3 bg-white border border-amber-200/80 rounded-lg shadow-sm hover:border-amber-400 transition-colors flex items-center justify-between"
              >
                <div className="truncate mr-3">
                  <span className="text-xs font-semibold text-slate-900 block truncate">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="font-mono text-brand-700">{task.formattedKey}</span>
                    <span>•</span>
                    <span className="text-rose-600 font-medium">
                      Due {new Date(task.dueDate!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <PriorityBadge priority={task.priority} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content Split: Recent Projects and My Assigned Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Active Projects</h2>
            <Link
              to="/projects"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {metrics.recentProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-300 hover:shadow transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {project.key}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900">{project.name}</h3>
                    </div>
                    {project.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{project.description}</p>
                    )}
                  </div>
                  {project.teamName && (
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      {project.teamName}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>
                      {project.completedTaskCount} of {project.taskCount} tasks completed
                    </span>
                    <span className="font-semibold text-slate-800">{project.progressPercentage}%</span>
                  </div>
                  <ProgressBar progress={project.progressPercentage} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* My Assigned Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">My Assigned Tasks</h2>
            <Link
              to="/my-tasks"
              className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {metrics.myAssignedTasks.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-0.5">No unfinished tasks currently assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.myAssignedTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/projects/${task.projectId}?taskId=${task.id}`}
                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-300 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-brand-600 font-semibold">
                        {task.formattedKey}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{task.projectName}</span>
                      {task.dueDate && (
                        <>
                          <span>•</span>
                          <span className={task.isOverdue ? 'text-rose-600 font-medium' : ''}>
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />
    </div>
  );
};
