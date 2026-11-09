import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users2,
  UserCheck,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  User,
  Layers,
  Building2,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { Avatar } from '../components/ui/Avatar';
import { RoleBadge } from '../components/ui/Badge';
import { CreateWorkspaceModal } from '../components/workspace/CreateWorkspaceModal';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, switchWorkspace } = useWorkspace();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'My Tasks', href: '/my-tasks', icon: CheckSquare },
    { name: 'Teams', href: '/teams', icon: Users2 },
    { name: 'Members', href: '/members', icon: UserCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Persistent Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block leading-none">
              Team OS
            </span>
            <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider block mt-1">
              Milestone 1 Core
            </span>
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 border-b border-slate-100 relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-200">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {activeWorkspace?.name || 'Select Workspace'}
                </p>
                {activeWorkspace && (
                  <p className="text-[10px] text-slate-500 capitalize">{activeWorkspace.role.toLowerCase()}</p>
                )}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          </button>

          {/* Switcher Dropdown */}
          {isWorkspaceMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsWorkspaceMenuOpen(false)}
              />
              <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-fadeIn">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Workspaces
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        switchWorkspace(ws.id);
                        setIsWorkspaceMenuOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-3 py-2 text-xs transition-colors',
                        ws.id === activeWorkspace?.id
                          ? 'bg-brand-50 text-brand-900 font-medium'
                          : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="truncate">{ws.name}</span>
                        <RoleBadge role={ws.role} />
                      </div>
                      {ws.id === activeWorkspace?.id && (
                        <Check className="w-3.5 h-3.5 text-brand-600 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsWorkspaceMenuOpen(false);
                      setIsCreateWorkspaceOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Workspace</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70',
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile Bar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200">
            <Link to="/profile" className="flex items-center gap-2.5 truncate hover:opacity-80 transition-opacity">
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              title="Sign out"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        <div className="p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>

      <CreateWorkspaceModal
        isOpen={isCreateWorkspaceOpen}
        onClose={() => setIsCreateWorkspaceOpen(false)}
      />
    </div>
  );
};

