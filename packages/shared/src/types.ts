import { WorkspaceRole, ProjectStatus, TaskStatus, TaskPriority } from './enums.js';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserSummary;
  accessToken: string;
  refreshToken?: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  role: WorkspaceRole;
  createdAt: string;
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  owner: UserSummary;
  memberCount: number;
  projectCount: number;
}

export interface WorkspaceMemberSummary {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: UserSummary;
  teams: { id: string; name: string }[];
}

export interface TeamSummary {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  createdById: string;
  createdAt: string;
  memberCount: number;
  members: {
    id: string;
    userId: string;
    joinedAt: string;
    user: UserSummary;
  }[];
}

export interface ProjectSummary {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string | null;
  teamId?: string | null;
  teamName?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  targetDate?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  completedTaskCount: number;
  progressPercentage: number;
}

export interface TaskSummary {
  id: string;
  workspaceId: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  taskNumber: number;
  formattedKey: string; // e.g. "CRM-1"
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string | null;
  assignee?: UserSummary | null;
  creatorId: string;
  creator: UserSummary;
  startDate?: string | null;
  dueDate?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  isOverdue?: boolean;
}

export interface TaskCommentSummary {
  id: string;
  workspaceId: string;
  taskId: string;
  authorId: string;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  totalActiveProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  overdueTasksCount: number;
  myAssignedTasks: TaskSummary[];
  overdueTasks: TaskSummary[];
  recentProjects: ProjectSummary[];
}

