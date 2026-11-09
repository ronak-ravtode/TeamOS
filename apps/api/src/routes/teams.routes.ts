import { Router } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { TeamsController } from '../controllers/teams.controller';
import { requireWorkspace, requireRole } from '../middleware/workspace.middleware';

const router = Router({ mergeParams: true });

router.use(requireWorkspace);

router.get('/', TeamsController.list);
router.post('/', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), TeamsController.create);
router.delete('/:teamId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), TeamsController.delete);
router.post('/:teamId/members', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), TeamsController.addMember);
router.delete('/:teamId/members/:userId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), TeamsController.removeMember);

export default router;

