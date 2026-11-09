import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, CheckCircle2, Building2, Users, ArrowRight } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(12, 'Password must be at least 12 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterValues = z.infer<typeof registerSchema>;
type AccountType = 'owner' | 'member';

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<AccountType>('owner');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterValues) => {
    try {
      setAuthError(null);
      await registerAuth(data.name, data.email, data.password, data.confirmPassword);
      
      // Store intent so routing knows if onboarding is needed
      localStorage.setItem('teamos_registered_account_type', accountType);

      if (accountType === 'member') {
        // Team member does not need to create a workspace
        navigate('/member-welcome');
      } else {
        // Owner/Admin is guided to workspace creation onboarding
        navigate('/onboarding');
      }
    } catch (err: any) {
      setAuthError(
        err.response?.data?.message || 'Registration failed. Please check your details and try again.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Choose your role and get started with Team OS.
        </p>
      </div>

      {authError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <span>{authError}</span>
            {authError.toLowerCase().includes('already exists') && (
              <div>
                <Link to="/login" className="font-semibold underline text-rose-800 hover:text-rose-900">
                  Click here to Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Type Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          Select Your Account Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountType('owner')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              accountType === 'owner'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-100 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Building2 className={`w-4 h-4 ${accountType === 'owner' ? 'text-brand-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-900">Company Owner / Admin</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              I want to create a workspace and manage my team & projects.
            </p>
            {accountType === 'owner' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setAccountType('member')}
            className={`p-3 rounded-xl border text-left transition-all relative ${
              accountType === 'member'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-100 shadow-sm'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className={`w-4 h-4 ${accountType === 'member' ? 'text-brand-600' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-900">Team Member</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              I am joining an existing company workspace or team.
            </p>
            {accountType === 'member' && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-600" />
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          {accountType === 'owner'
            ? 'ℹ️ You will be guided through creating your company workspace.'
            : '✨ Direct sign-up: Team Members do not need to create a workspace.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Alex Morgan"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Work Email Address"
          type="email"
          placeholder="alex@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="space-y-1">
          <Input
            label="Password (min 12 characters)"
            type="password"
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                passwordValue.length >= 12 ? 'text-emerald-500' : 'text-slate-300'
              }`}
            />
            <span>At least 12 characters</span>
          </div>
        </div>

        <Input
          label="Confirm Password"
          type="password"
          placeholder="••••••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" size="md" className="w-full mt-2" isLoading={isSubmitting}>
          {accountType === 'owner'
            ? 'Create Account & Setup Workspace'
            : 'Create Team Member Account'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};
