import React from 'react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className, showText = false }) => {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress || 0)));

  const getColor = (val: number) => {
    if (val >= 100) return 'bg-emerald-500';
    if (val >= 50) return 'bg-brand-600';
    return 'bg-amber-500';
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={clsx('h-full transition-all duration-500 rounded-full', getColor(safeProgress))}
            style={{ width: `${safeProgress}%` }}
          />
        </div>
        {showText && (
          <span className="text-xs font-semibold text-slate-700 shrink-0 min-w-[32px] text-right font-mono">
            {safeProgress}%
          </span>
        )}
      </div>
    </div>
  );
};

