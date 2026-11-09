import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Users2,
  Archive,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { ProjectSummary, ProjectStatus } from '@teamos/shared';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CreateProjectModal } from '../../components/projects/CreateProjectModal';

export const ProjectsPage: React.FC = () => {
  const { activeWorkspace, canManage } = useWorkspace();
  const [activeTab, setActiveTab] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: projects = [], isLoading } = useQuery<ProjectSummary[]>({
    queryKey: ['workspace-projects', activeWorkspace?.id, activeTab],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const res = await apiClient.get<ProjectSummary[]>(
        `/workspaces/${activeWorkspace.id}/projects?status=${activeTab}`,
      );
      return res.data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize roadmaps, sprints, and team tasks into structured project containers.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Project
          </Button>
        )}
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab(ProjectStatus.ACTIVE)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === ProjectStatus.ACTIVE
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Projects
          </button>
          <button
            onClick={() => setActiveTab(ProjectStatus.ARCHIVED)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === ProjectStatus.ARCHIVED
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Archived Projects
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
          />
        </div>
      </div>

      {/* Projects List */}
      {isLoading ? (
        <LoadingSpinner message="Loading workspace projects..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={activeTab === ProjectStatus.ACTIVE ? <FolderKanban className="w-8 h-8 text-brand-600" /> : <Archive className="w-8 h-8 text-slate-400" />}
          title={search ? 'No projects match your search' : activeTab === ProjectStatus.ACTIVE ? 'No active projects yet' : 'No archived projects'}
          description={
            search
              ? `No projects found for query "${search}". Try searching by a different name or key.`
              : activeTab === ProjectStatus.ACTIVE
              ? 'Create a project to start planning deliverables and tracking tasks.'
              : 'Completed and closed projects archived by workspace administrators will appear here.'
          }
          actionLabel={!search && activeTab === ProjectStatus.ACTIVE && canManage ? 'Create Project' : undefined}
          onAction={!search && activeTab === ProjectStatus.ACTIVE && canManage ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100">
                    {project.key}
                  </span>
                  {project.teamName && (
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full flex items-center gap-1">
                      <Users2 className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[120px]">{project.teamName}</span>
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{project.completedTaskCount} / {project.taskCount} tasks done</span>
                  <span className="font-semibold text-slate-800">{project.progressPercentage}%</span>
                </div>
                <ProgressBar progress={project.progressPercentage} />

                {project.targetDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {new Date(project.targetDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

