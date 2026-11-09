import { Router } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { TasksController } from '../controllers/tasks.controller';
import { CommentsController } from '../controllers/comments.controller';
import { requireWorkspace, requireRole } from '../middleware/workspace.middleware';

const router = Router({ mergeParams: true });

router.use(requireWorkspace);

router.get('/', TasksController.list);
router.post('/', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER), TasksController.create);
router.get('/:taskId', TasksController.getById);
router.patch('/:taskId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER), TasksController.update);
router.delete('/:taskId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), TasksController.delete);

// Nested comments for task
router.get('/:taskId/comments', CommentsController.listForTask);
router.post('/:taskId/comments', CommentsController.create);

export default router;

