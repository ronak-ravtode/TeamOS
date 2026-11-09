import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, RefreshCw, Building2, LogOut, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Button } from '../../components/ui/Button';

export const MemberWelcomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { refreshWorkspaces, isLoading } = useWorkspace();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Auto-check every 3.5 seconds in case workspace owner adds this email
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const list = await refreshWorkspaces();
        if (isMounted && list && list.length > 0) {
          localStorage.removeItem('teamos_registered_account_type');
          navigate('/');
        }
      } catch (err) {
        // Silently retry on next tick
      }
    }, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate, refreshWorkspaces]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setMessage(null);
    try {
      const list = await refreshWorkspaces();
      if (list && list.length > 0) {
        localStorage.removeItem('teamos_registered_account_type');
        navigate('/');
      } else {
        setMessage('No workspace memberships found yet. Ask your team owner or admin to add this email to their workspace.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateOwnWorkspace = () => {
    localStorage.removeItem('teamos_registered_account_type');
    navigate('/onboarding');
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-6 text-center animate-fadeIn">
      <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
        <Users className="w-7 h-7" />
      </div>

      <div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" /> Team Member Account Active
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome, {user?.name}!
        </h2>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Your account is registered as a <strong className="text-slate-700">Team Member</strong>. You do not need to create a company workspace.
        </p>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Waiting for Team Invitation</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Auto-detecting
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Ask your workspace <strong className="text-slate-800">Owner</strong> or <strong className="text-slate-800">Admin</strong> to add your registered email:
        </p>
        <div className="p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-medium text-brand-700 text-center select-all shadow-sm">
          {user?.email}
        </div>
        <p className="text-[11px] text-slate-400">
          As soon as your team owner adds you under <em>Workspace Members</em>, this screen will automatically transition you to the workspace!
        </p>
      </div>

      {message && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
          {message}
        </div>
      )}

      <div className="space-y-3 pt-2">
        <Button
          size="md"
          className="w-full"
          onClick={handleRefresh}
          isLoading={isRefreshing || isLoading}
          icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
        >
          Check Workspaces Now
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Or</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleCreateOwnWorkspace}
          icon={<Building2 className="w-4 h-4" />}
        >
          Create My Own Company Workspace Instead
        </Button>

        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 pt-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out of this account
        </button>
      </div>
    </div>
  );
};
