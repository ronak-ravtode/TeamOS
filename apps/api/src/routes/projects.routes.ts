import { Router } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { ProjectsController } from '../controllers/projects.controller';
import { requireWorkspace, requireRole } from '../middleware/workspace.middleware';

const router = Router({ mergeParams: true });

router.use(requireWorkspace);

router.get('/', ProjectsController.list);
router.post('/', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER), ProjectsController.create);
router.get('/:projectId', ProjectsController.getById);
router.patch('/:projectId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), ProjectsController.update);
router.delete('/:projectId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), ProjectsController.delete);

export default router;

