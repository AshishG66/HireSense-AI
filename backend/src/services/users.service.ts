import usersRepository from '../repositories/users.repository';
import { CreateUserDto } from '../validators/users.validator';
import { ConflictError } from '../utils/AppError';

export class UsersService {
  async createUser(data: CreateUserDto) {
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email address already in use');
    }
    return usersRepository.create(data);
  }

  async getAllUsers() {
    return usersRepository.findAll();
  }

  async getUserById(id: string) {
    return usersRepository.findById(id);
  }
}

export const usersService = new UsersService();
export default usersService;
