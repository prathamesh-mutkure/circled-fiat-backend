import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.userService.findUserById(id);
  }

  @Get('email/:email')
  async getByEmail(@Param('email') email: string) {
    return this.userService.findUserByEmail(email);
  }

  @Get('apiKey/:apiKey')
  async getByApiKey(@Param('apiKey') apiKey: string) {
    return this.userService.findUserByApiKey(apiKey);
  }
}
