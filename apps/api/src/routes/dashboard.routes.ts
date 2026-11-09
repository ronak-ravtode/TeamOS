import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { requireWorkspace } from '../middleware/workspace.middleware';

const router = Router({ mergeParams: true });

router.use(requireWorkspace);

router.get('/', DashboardController.getMetrics);

export default router;

