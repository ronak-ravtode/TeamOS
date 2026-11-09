import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { workspaces, isLoading: isWsLoading } = useWorkspace();

  if (isAuthLoading || isWsLoading) {
    return <LoadingSpinner message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (workspaces.length === 0) {
    const registeredAccountType = localStorage.getItem('teamos_registered_account_type');
    if (registeredAccountType === 'member') {
      return <Navigate to="/member-welcome" replace />;
    }
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

export const OnboardingRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { workspaces } = useWorkspace();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a workspace, skip onboarding!
  if (workspaces.length > 0) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const MemberWelcomeRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { workspaces } = useWorkspace();

  if (isLoading) {
    return <LoadingSpinner message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the member has now been added to a workspace, enter directly!
  if (workspaces.length > 0) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
