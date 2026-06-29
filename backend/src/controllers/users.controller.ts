import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { NotFoundError } from '../utils/AppError';
import { ApiResponse } from '../utils/ApiResponse';

export class UsersController {
  async createUser(req: Request, res: Response) {
    const user = await usersService.createUser(req.body);
    return res.status(201).json(ApiResponse.success(user, 'User created successfully'));
  }

  async getAllUsers(_req: Request, res: Response) {
    const users = await usersService.getAllUsers();
    return res.json(ApiResponse.success(users, 'Users retrieved successfully'));
  }

  async getUserById(req: Request, res: Response) {
    const user = await usersService.getUserById(req.params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return res.json(ApiResponse.success(user, 'User retrieved successfully'));
  }
}

export const usersController = new UsersController();
export default usersController;
