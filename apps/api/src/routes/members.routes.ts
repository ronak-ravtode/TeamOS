import { Router } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { MembersController } from '../controllers/members.controller';
import { requireWorkspace, requireRole } from '../middleware/workspace.middleware';

const router = Router({ mergeParams: true });

router.use(requireWorkspace);

router.get('/', MembersController.list);
router.post('/', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), MembersController.add);
router.patch('/:memberId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), MembersController.updateRole);
router.delete('/:memberId', requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN), MembersController.remove);

export default router;

