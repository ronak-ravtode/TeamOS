import React from 'react';
import { TaskStatus, TaskPriority, WorkspaceRole } from '@teamos/shared';
import { clsx } from 'clsx';

export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'slate';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-800 text-slate-100 border-slate-700',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium border rounded-full whitespace-nowrap',
        variants[variant],
        sizes[size],
      )}
    >
      {children}
    </span>
  );
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case TaskStatus.DONE:
      return <Badge variant="success">Done</Badge>;
    case TaskStatus.IN_PROGRESS:
      return <Badge variant="info">In Progress</Badge>;
    case TaskStatus.IN_REVIEW:
      return <Badge variant="purple">In Review</Badge>;
    case TaskStatus.BLOCKED:
      return <Badge variant="danger">Blocked</Badge>;
    case TaskStatus.TODO:
      return <Badge variant="default">To Do</Badge>;
    case TaskStatus.BACKLOG:
      return <Badge variant="default">Backlog</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  switch (priority) {
    case TaskPriority.URGENT:
      return <Badge variant="danger">Urgent</Badge>;
    case TaskPriority.HIGH:
      return <Badge variant="warning">High</Badge>;
    case TaskPriority.MEDIUM:
      return <Badge variant="info">Medium</Badge>;
    case TaskPriority.LOW:
      return <Badge variant="default">Low</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: WorkspaceRole }> = ({ role }) => {
  switch (role) {
    case WorkspaceRole.OWNER:
      return <Badge variant="slate">Owner</Badge>;
    case WorkspaceRole.ADMIN:
      return <Badge variant="purple">Admin</Badge>;
    case WorkspaceRole.MEMBER:
      return <Badge variant="default">Member</Badge>;
    default:
      return <Badge>{role}</Badge>;
  }
};

