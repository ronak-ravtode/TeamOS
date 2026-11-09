import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  MessageSquare,
  Calendar,
  AlertTriangle,
  MoreVertical,
  ArrowRight,
} from 'lucide-react';
import { TaskSummary, TaskStatus, TaskPriority } from '@teamos/shared';
import { apiClient } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PriorityBadge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';

interface Props {
  tasks: TaskSummary[];
  projectId?: string;
  isArchivedProject?: boolean;
}

const COLUMNS: { status: TaskStatus; label: string; headerColor: string }[] = [
  { status: TaskStatus.BACKLOG, label: 'Backlog', headerColor: 'bg-slate-100 text-slate-700' },
  { status: TaskStatus.TODO, label: 'To Do', headerColor: 'bg-slate-100 text-slate-700' },
  { status: TaskStatus.IN_PROGRESS, label: 'In Progress', headerColor: 'bg-sky-50 text-sky-700 border-sky-200' },
  { status: TaskStatus.IN_REVIEW, label: 'In Review', headerColor: 'bg-purple-50 text-purple-700 border-purple-200' },
  { status: TaskStatus.BLOCKED, label: 'Blocked', headerColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { status: TaskStatus.DONE, label: 'Done', headerColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

export const KanbanBoard: React.FC<Props> = ({ tasks, projectId, isArchivedProject }) => {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createColumnStatus, setCreateColumnStatus] = useState<TaskStatus | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  const moveStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
      return apiClient.patch(`/workspaces/${activeWorkspace?.id}/tasks/${taskId}`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-detail'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
    },
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 items-start min-h-[600px]">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status);

        return (
          <div
            key={column.status}
            className="w-72 shrink-0 bg-slate-100/70 border border-slate-200/80 rounded-2xl flex flex-col max-h-[calc(100vh-220px)]"
          >
            {/* Column Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 tracking-tight">
                  {column.label}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 font-semibold shadow-2xs">
                  {columnTasks.length}
                </span>
              </div>
              {!isArchivedProject && (
                <button
                  onClick={() => setCreateColumnStatus(column.status)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                  title={`Add task to ${column.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Column Cards */}
            <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-brand-300 transition-all cursor-pointer relative group"
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-[11px] font-bold text-brand-700">
                      {task.formattedKey}
                    </span>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <PriorityBadge priority={task.priority} />
                      {/* Quick Move Status Menu */}
                      {!isArchivedProject && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)
                            }
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title="Move task"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuTaskId === task.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveMenuTaskId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5">
                                <span className="block px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                                  Move to
                                </span>
                                {COLUMNS.filter((c) => c.status !== task.status).map((targetCol) => (
                                  <button
                                    key={targetCol.status}
                                    onClick={() => {
                                      moveStatusMutation.mutate({
                                        taskId: task.id,
                                        newStatus: targetCol.status,
                                      });
                                      setActiveMenuTaskId(null);
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                                  >
                                    <span>{targetCol.label}</span>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-relaxed">
                    {task.title}
                  </h4>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <div
                          className={`flex items-center gap-1 ${
                            task.isOverdue ? 'text-rose-600 font-semibold' : ''
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      )}
                      {task.commentCount > 0 && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <MessageSquare className="w-3 h-3" />
                          <span>{task.commentCount}</span>
                        </div>
                      )}
                    </div>

                    {task.assignee ? (
                      <Avatar name={task.assignee.name} size="xs" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                        ?
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}

      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />

      <CreateTaskModal
        isOpen={!!createColumnStatus}
        onClose={() => setCreateColumnStatus(null)}
        defaultProjectId={projectId}
        defaultStatus={createColumnStatus || TaskStatus.TODO}
      />
    </div>
  );
};

