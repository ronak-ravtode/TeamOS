import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { WorkspaceSummary, WorkspaceRole } from '@teamos/shared';
import { useAuth } from './AuthContext';

interface WorkspaceContextType {
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => Promise<WorkspaceSummary[]>;
  createWorkspace: (name: string, description?: string, slug?: string) => Promise<WorkspaceSummary>;
  isOwner: boolean;
  isAdmin: boolean;
  canManage: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = async (): Promise<WorkspaceSummary[]> => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      setIsLoading(false);
      return [];
    }

    try {
      setIsLoading(true);
      const res = await apiClient.get<WorkspaceSummary[]>('/workspaces');
      setWorkspaces(res.data);

      const savedWorkspaceId = localStorage.getItem('teamos_active_workspace_id');
      const found = res.data.find((w) => w.id === savedWorkspaceId);

      if (found) {
        setActiveWorkspace(found);
      } else if (res.data.length > 0) {
        setActiveWorkspace(res.data[0]);
        localStorage.setItem('teamos_active_workspace_id', res.data[0].id);
      } else {
        setActiveWorkspace(null);
        localStorage.removeItem('teamos_active_workspace_id');
      }
      return res.data;
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [isAuthenticated]);

  const switchWorkspace = (workspaceId: string) => {
    const target = workspaces.find((w) => w.id === workspaceId);
    if (target) {
      // Invalidate all active queries to guarantee no stale data from old workspace!
      queryClient.clear();
      setActiveWorkspace(target);
      localStorage.setItem('teamos_active_workspace_id', target.id);
    }
  };

  const createWorkspace = async (name: string, description?: string, slug?: string) => {
    const res = await apiClient.post<WorkspaceSummary>('/workspaces', { name, description, slug });
    await fetchWorkspaces();
    switchWorkspace(res.data.id);
    return res.data;
  };

  const isOwner = activeWorkspace?.role === WorkspaceRole.OWNER;
  const isAdmin = activeWorkspace?.role === WorkspaceRole.ADMIN;
  const canManage = isOwner || isAdmin;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        switchWorkspace,
        refreshWorkspaces: fetchWorkspaces,
        createWorkspace,
        isOwner,
        isAdmin,
        canManage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

