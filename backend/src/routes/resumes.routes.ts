import { Router, Request, Response } from 'express';
import multer from 'multer';
import resumesController from '../controllers/resumes.controller';
import { renameResumeSchema, analyzeResumeSchema } from '../validators/resume.validator';
import validate from '../middlewares/validate';
import asyncHandler from '../middlewares/asyncHandler';
import authenticate from '../middlewares/auth';
import { roleGuard } from '../middlewares/roleGuard';
import { ROLES } from '../constants';
import { ValidationError } from '../utils/AppError';
import storageService from '../services/storage.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError('Only PDF and DOC/DOCX files are allowed') as any);
    }
  },
});

router.post(
  '/',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  upload.single('resume'),
  asyncHandler(resumesController.createResume),
);

router.post(
  '/:id/versions',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  upload.single('resume'),
  asyncHandler(resumesController.addNewVersion),
);

router.patch(
  '/:id',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  validate(renameResumeSchema),
  asyncHandler(resumesController.renameResume),
);

router.delete(
  '/:id',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(resumesController.deleteResume),
);

router.patch(
  '/:id/default',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(resumesController.setDefaultResume),
);

router.get(
  '/',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(resumesController.getResumes),
);

router.get(
  '/:id',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(resumesController.getResumeById),
);

router.get(
  '/versions/:versionId/download',
  authenticate,
  asyncHandler(resumesController.downloadResume),
);

router.get(
  '/versions/download-raw',
  asyncHandler(async (req: Request, res: Response) => {
    const pathQuery = req.query.path as string;
    if (!pathQuery) throw new ValidationError('File path is required');
    const buffer = await storageService.download(pathQuery);
    res.setHeader('Content-Type', 'application/pdf');
    return res.send(buffer);
  }),
);

router.post(
  '/versions/:versionId/analyze',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  validate(analyzeResumeSchema),
  asyncHandler(resumesController.triggerAnalysis),
);

router.get(
  '/analysis/jobs/:jobId',
  authenticate,
  roleGuard([ROLES.CANDIDATE]),
  asyncHandler(resumesController.getJobStatus),
);

export default router;
