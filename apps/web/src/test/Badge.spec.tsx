import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TaskStatusBadge, PriorityBadge, RoleBadge } from '../components/ui/Badge';
import { TaskStatus, TaskPriority, WorkspaceRole } from '@teamos/shared';

describe('UI Badges', () => {
  it('renders correct task status badges', () => {
    const { rerender } = render(<TaskStatusBadge status={TaskStatus.DONE} />);
    expect(screen.getByText('Done')).toBeInTheDocument();

    rerender(<TaskStatusBadge status={TaskStatus.IN_PROGRESS} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<TaskStatusBadge status={TaskStatus.BLOCKED} />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('renders correct priority badges', () => {
    const { rerender } = render(<PriorityBadge priority={TaskPriority.URGENT} />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();

    rerender(<PriorityBadge priority={TaskPriority.LOW} />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders correct workspace role badges', () => {
    const { rerender } = render(<RoleBadge role={WorkspaceRole.OWNER} />);
    expect(screen.getByText('Owner')).toBeInTheDocument();

    rerender(<RoleBadge role={WorkspaceRole.ADMIN} />);
    expect(screen.getByText('Admin')).toBeInTheDocument();

    rerender(<RoleBadge role={WorkspaceRole.MEMBER} />);
    expect(screen.getByText('Member')).toBeInTheDocument();
  });
});

