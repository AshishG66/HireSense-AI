import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import asyncHandler from '../middlewares/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getHealth));

export default router;
