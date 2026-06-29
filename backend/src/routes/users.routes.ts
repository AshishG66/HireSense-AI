import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { createUserSchema } from '../validators/users.validator';
import validate from '../middlewares/validate';
import asyncHandler from '../middlewares/asyncHandler';

const router = Router();

router.post('/', validate(createUserSchema), asyncHandler(usersController.createUser));
router.get('/', asyncHandler(usersController.getAllUsers));
router.get('/:id', asyncHandler(usersController.getUserById));

export default router;
