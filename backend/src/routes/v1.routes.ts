import { Router } from 'express';
import healthRoutes from './health.routes';
import usersRoutes from './users.routes';
import authRoutes from './auth.routes';
import jobsRoutes from './jobs.routes';
import applicationsRoutes from './applications.routes';

import resumesRoutes from './resumes.routes';
import notificationsRoutes from './notifications.routes';
import interviewsRoutes from './interviews.routes';
import assessmentsRoutes from './assessments.routes';
import monitoringRoutes from './monitoring.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/jobs', jobsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/resumes', resumesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/interviews', interviewsRoutes);
router.use('/assessments', assessmentsRoutes);
router.use('/monitoring', monitoringRoutes);

export default router;
