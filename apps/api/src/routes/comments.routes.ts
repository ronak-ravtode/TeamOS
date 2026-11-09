import { Router } from 'express';
import { CommentsController } from '../controllers/comments.controller';
import { requireWorkspace } from '../middleware/workspace.middleware';

const router = Router({ mergeParams: true });

router.use(requireWorkspace);

router.patch('/:commentId', CommentsController.update);
router.delete('/:commentId', CommentsController.delete);

export default router;

