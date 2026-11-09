import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useWorkspace } from '../../context/WorkspaceContext';

const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  description: z.string().max(250).optional(),
});

type FormValues = z.infer<typeof createWorkspaceSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createWorkspace } = useWorkspace();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createWorkspaceSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createWorkspace(data.name, data.description);
      reset();
      onClose();
    } catch (err) {
      console.error('Failed to create workspace:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      description="Create an isolated workspace container for projects and teams."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Workspace Name"
          placeholder="e.g. Acme Corp or Growth Team"
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
            placeholder="Brief overview of this workspace..."
            {...register('description')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

