import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create({
    email,
    password,
    walletAddress,
  }: CreateUserDTO): Promise<User> {
    const newUser = await this.prisma.user.create({
      data: {
        email,
        password,
        walletAddress,
        apiKey: uuidv4(),
      },
    });

    return newUser;
  }

  async findUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findUserByApiKey(apiKey: string): Promise<User> {
    return this.prisma.user.findUnique({
      where: {
        apiKey,
      },
    });
  }
}
