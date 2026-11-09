import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Shield, Calendar, Check, Lock } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useWorkspace } from '../../context/WorkspaceContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const settingsSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
  description: z.string().max(250).optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export const WorkspaceSettingsPage: React.FC = () => {
  const { activeWorkspace, canManage, refreshWorkspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: workspaceDetails, isLoading } = useQuery({
    queryKey: ['workspace-details', activeWorkspace?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/workspaces/${activeWorkspace?.id}`);
      return res.data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
  });

  useEffect(() => {
    if (workspaceDetails) {
      reset({
        name: workspaceDetails.name,
        description: workspaceDetails.description || '',
      });
    }
  }, [workspaceDetails, reset]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsValues) => {
      return apiClient.patch(`/workspaces/${activeWorkspace?.id}`, data);
    },
    onSuccess: async () => {
      await refreshWorkspaces();
      queryClient.invalidateQueries({ queryKey: ['workspace-details', activeWorkspace?.id] });
      setSuccessMessage('Workspace settings updated successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  if (isLoading || !workspaceDetails) {
    return <LoadingSpinner message="Loading workspace settings..." />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage container identity, slug, and organizational properties.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metadata Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          General Information
        </h3>

        <form
          onSubmit={handleSubmit((data) => updateSettingsMutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Workspace Name"
            error={errors.name?.message}
            disabled={!canManage}
            {...register('name')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1">
              Workspace URL Slug
            </label>
            <div className="px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-600 select-all">
              {workspaceDetails.slug}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Unique immutable tenant slug used in multi-tenant isolation.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Description
            </label>
            <textarea
              rows={3}
              disabled={!canManage}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors"
              placeholder="Workspace description..."
              {...register('description')}
            />
          </div>

          {canManage ? (
            <div className="pt-2">
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Only workspace owners and administrators can modify settings.</span>
            </div>
          )}
        </form>
      </div>

      {/* Ownership & Container Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
          Ownership & Boundary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Designated Owner
            </span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {workspaceDetails.owner ? workspaceDetails.owner.name : 'Unknown'}
            </span>
            <span className="text-[11px] text-slate-500">
              {workspaceDetails.owner?.email}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">
              Created On
            </span>
            <span className="font-semibold text-slate-900 mt-0.5 block">
              {new Date(workspaceDetails.createdAt).toLocaleDateString([], {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

