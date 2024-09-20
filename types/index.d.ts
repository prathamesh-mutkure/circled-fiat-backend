import { User } from '@prisma/client';
import { Request } from 'express';

type RequestUser = Omit<User, 'password'>;

type AuthRequest = Request & {
  user: RequestUser;
};
