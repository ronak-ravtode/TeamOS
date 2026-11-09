import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  User,
  Clock,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { TaskStatusBadge, PriorityBadge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  TaskSummary,
  TaskCommentSummary,
  TaskStatus,
  TaskPriority,
  WorkspaceMemberSummary,
  ProjectStatus,
} from '@teamos/shared';

interface Props {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const TaskDetailModal: React.FC<Props> = ({ taskId, isOpen, onClose, onDeleted }) => {
  const { user } = useAuth();
  const { activeWorkspace, canManage, isOwner, isAdmin } = useWorkspace();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');

  // Fetch task detail
  const { data: task, isLoading } = useQuery<TaskSummary & { comments: TaskCommentSummary[] }>({
    queryKey: ['task-detail', activeWorkspace?.id, taskId],
    queryFn: async () => {
      if (!taskId || !activeWorkspace?.id) return null;
      const res = await apiClient.get(`/workspaces/${activeWorkspace.id}/tasks/${taskId}`);
      return res.data;
    },
    enabled: isOpen && !!taskId && !!activeWorkspace?.id,
  });

  // Fetch workspace members for assignment dropdown
  const { data: members = [] } = useQuery<WorkspaceMemberSummary[]>({
    queryKey: ['workspace-members', activeWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${activeWorkspace?.id}/members`);
      return res.data;
    },
    enabled: isOpen && !!activeWorkspace?.id,
  });

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.patch(`/workspaces/${activeWorkspace?.id}/tasks/${taskId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', activeWorkspace?.id, taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/workspaces/${activeWorkspace?.id}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-projects'] });
      setIsDeleteTaskOpen(false);
      onClose();
      if (onDeleted) onDeleted();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.post(`/workspaces/${activeWorkspace?.id}/tasks/${taskId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task-detail', activeWorkspace?.id, taskId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return apiClient.patch(`/workspaces/${activeWorkspace?.id}/comments/${commentId}`, { content });
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditCommentText('');
      queryClient.invalidateQueries({ queryKey: ['task-detail', activeWorkspace?.id, taskId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiClient.delete(`/workspaces/${activeWorkspace?.id}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-detail', activeWorkspace?.id, taskId] });
    },
  });

  if (!isOpen || !taskId) return null;

  const canDeleteTask = canManage || task?.creatorId === user?.id;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={task?.formattedKey || 'Task Details'} maxWidth="2xl">
        {isLoading || !task ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading task details...</div>
        ) : (
          <div className="space-y-6">
            {/* Task Header & Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                  {task.formattedKey}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  in {task.projectName}
                </span>
                {task.isOverdue && (
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Overdue
                  </span>
                )}
              </div>

              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-base font-semibold border rounded-lg focus:ring-2 focus:ring-brand-200"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (editedTitle.trim()) {
                        updateTaskMutation.mutate({ title: editedTitle.trim() });
                      }
                      setIsEditingTitle(false);
                    }}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditingTitle(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between group">
                  <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
                  <button
                    onClick={() => {
                      setEditedTitle(task.title);
                      setIsEditingTitle(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                    title="Edit title"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Properties Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => updateTaskMutation.mutate({ status: e.target.value as TaskStatus })}
                  className="mt-1 w-full bg-white border border-slate-200 rounded p-1 font-medium text-slate-800"
                >
                  <option value={TaskStatus.BACKLOG}>Backlog</option>
                  <option value={TaskStatus.TODO}>To Do</option>
                  <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TaskStatus.IN_REVIEW}>In Review</option>
                  <option value={TaskStatus.BLOCKED}>Blocked</option>
                  <option value={TaskStatus.DONE}>Done</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => updateTaskMutation.mutate({ priority: e.target.value as TaskPriority })}
                  className="mt-1 w-full bg-white border border-slate-200 rounded p-1 font-medium text-slate-800"
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                  <option value={TaskPriority.URGENT}>Urgent</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assignee</span>
                <select
                  value={task.assigneeId || ''}
                  onChange={(e) => updateTaskMutation.mutate({ assigneeId: e.target.value || null })}
                  className="mt-1 w-full bg-white border border-slate-200 rounded p-1 font-medium text-slate-800"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Due Date</span>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                  onChange={(e) => updateTaskMutation.mutate({ dueDate: e.target.value || null })}
                  className="mt-1 w-full bg-white border border-slate-200 rounded p-1 font-medium text-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Description
                </span>
                {!isEditingDesc && (
                  <button
                    onClick={() => {
                      setEditedDesc(task.description || '');
                      setIsEditingDesc(true);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {task.description ? 'Edit' : '+ Add description'}
                  </button>
                )}
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-brand-200"
                    placeholder="Provide details..."
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateTaskMutation.mutate({ description: editedDesc.trim() || null });
                        setIsEditingDesc(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {task.description || <span className="text-slate-400 italic">No description provided.</span>}
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-4">
                <span>Created by {task.creator?.name || 'User'}</span>
                <span>{new Date(task.createdAt).toLocaleString()}</span>
              </div>
              {canDeleteTask && (
                <button
                  onClick={() => setIsDeleteTaskOpen(true)}
                  className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              )}
            </div>

            {/* Comments Stream */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                <span>Comments ({task.comments?.length || 0})</span>
              </div>

              {/* Add Comment Input */}
              <div className="flex gap-2.5">
                <Avatar name={user?.name || 'Me'} size="sm" className="mt-1" />
                <div className="flex-1 space-y-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or update..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={!commentText.trim()}
                      onClick={() => addCommentMutation.mutate(commentText.trim())}
                      isLoading={addCommentMutation.isPending}
                      icon={<Send className="w-3.5 h-3.5" />}
                    >
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comment History (Chronological) */}
              <div className="space-y-3 pt-2">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment) => {
                    const isAuthor = comment.authorId === user?.id;
                    const canDelete = isAuthor || canManage;

                    return (
                      <div key={comment.id} className="flex gap-2.5 group">
                        <Avatar name={comment.author.name} size="sm" className="mt-1" />
                        <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-slate-900">
                              {comment.author.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">
                                {new Date(comment.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              {isAuthor && editingCommentId !== comment.id && (
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.id);
                                    setEditCommentText(comment.content);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit comment"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="space-y-2 mt-1">
                              <textarea
                                rows={2}
                                value={editCommentText}
                                onChange={(e) => setEditCommentText(e.target.value)}
                                className="w-full p-2 text-xs border rounded bg-white"
                              />
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateCommentMutation.mutate({
                                      commentId: comment.id,
                                      content: editCommentText.trim(),
                                    })
                                  }
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingCommentId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400 italic">
                    No comments yet. Start the conversation above!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteTaskOpen}
        onClose={() => setIsDeleteTaskOpen(false)}
        onConfirm={() => deleteTaskMutation.mutate()}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone and will delete all associated task comments."
        confirmLabel="Delete Task"
        isLoading={deleteTaskMutation.isPending}
      />
    </>
  );
};

