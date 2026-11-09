import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Users, ShieldAlert, LogOut } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

const onboardingSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(50),
  description: z.string().max(250).optional(),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export const OnboardingPage: React.FC = () => {
  const { createWorkspace } = useWorkspace();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
  });

  const onSubmit = async (data: OnboardingValues) => {
    try {
      setErrorMsg(null);
      await createWorkspace(data.name, data.description);
      localStorage.removeItem('teamos_registered_account_type');
      navigate('/');
    } catch (err: any) {
      console.error('Failed to create initial workspace', err);
      setErrorMsg(err.response?.data?.message || 'Failed to create workspace. Please try again.');
    }
  };

  const handleSwitchToMemberMode = () => {
    localStorage.setItem('teamos_registered_account_type', 'member');
    navigate('/member-welcome');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Switch to member banner */}
      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[11px] font-medium">Joining an existing company or team?</span>
        </div>
        <button
          type="button"
          onClick={handleSwitchToMemberMode}
          className="font-semibold text-indigo-700 hover:text-indigo-900 underline text-[11px] ml-2 shrink-0"
        >
          Go to Member Waiting Room &rarr;
        </button>
      </div>

      <div className="text-center">
        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Building2 className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Welcome to Team OS</h2>
        <p className="mt-1 text-xs text-slate-500">
          Create your primary organization workspace to begin collaborating.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Workspace or Company Name"
          placeholder="e.g. Acme Corporation or Core Systems"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500 transition-colors"
            placeholder="What does your team build?"
            {...register('description')}
          />
        </div>

        <Button
          type="submit"
          size="md"
          className="w-full mt-2"
          isLoading={isSubmitting}
          icon={<ArrowRight className="w-4 h-4 ml-1" />}
        >
          Create Workspace & Enter
        </Button>
      </form>

      <div className="text-center pt-1">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
};

