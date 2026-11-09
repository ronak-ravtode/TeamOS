import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, ShieldAlert, Sparkles, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginValues) => {
    try {
      setAuthError(null);
      await login(data.email.trim().toLowerCase(), data.password);
      navigate('/');
    } catch (err: any) {
      if (!err.response) {
        setAuthError(
          `Unable to connect to backend server (${err.message || 'Network Error'}). Make sure the backend API is running on http://localhost:4000.`,
        );
      } else {
        setAuthError(
          err.response?.data?.message || 'Invalid email or password. Please verify your credentials.',
        );
      }
    }
  };

  const handleQuickLogin = async (email: string) => {
    setValue('email', email, { shouldValidate: true, shouldDirty: true });
    setValue('password', 'Password1234!', { shouldValidate: true, shouldDirty: true });
    setIsQuickLoggingIn(true);
    try {
      await onSubmit({ email, password: 'Password1234!' });
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered email and password to access your workspaces.
        </p>
      </div>

      {authError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[32px] text-slate-400 hover:text-slate-600 focus:outline-none"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <Button
          type="submit"
          size="md"
          className="w-full mt-2"
          isLoading={isSubmitting || isQuickLoggingIn}
        >
          Sign in
        </Button>
      </form>

      {/* Development Quick Accounts Helper */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>1-Click Test Sign In (Password: Password1234!)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-normal">Click any role to test</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <button
            type="button"
            disabled={isSubmitting || isQuickLoggingIn}
            onClick={() => handleQuickLogin('owner@alpha.test')}
            className="p-2 text-left rounded-lg border border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900">Alpha Owner</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-purple-200 text-purple-800 rounded font-bold">Owner</span>
            </div>
            <span className="text-slate-500 block truncate text-[10px]">owner@alpha.test</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || isQuickLoggingIn}
            onClick={() => handleQuickLogin('admin@alpha.test')}
            className="p-2 text-left rounded-lg border border-blue-200 bg-blue-50/40 hover:bg-blue-100/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900">Alpha Admin</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded font-bold">Admin</span>
            </div>
            <span className="text-slate-500 block truncate text-[10px]">admin@alpha.test</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || isQuickLoggingIn}
            onClick={() => handleQuickLogin('alice@alpha.test')}
            className="p-2 text-left rounded-lg border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-100/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Alice (Member)</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-200 text-emerald-800 rounded font-bold">Member</span>
            </div>
            <span className="text-slate-500 block truncate text-[10px]">alice@alpha.test</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting || isQuickLoggingIn}
            onClick={() => handleQuickLogin('david@beta.test')}
            className="p-2 text-left rounded-lg border border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900">Beta Owner</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 bg-amber-200 text-amber-800 rounded font-bold">Isolated</span>
            </div>
            <span className="text-slate-500 block truncate text-[10px]">david@beta.test</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          💡 Team Members sign in directly and enter their workspace without workspace onboarding.
        </p>
      </div>

      <div className="text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 underline">
          Create account
        </Link>
      </div>
    </div>
  );
};
