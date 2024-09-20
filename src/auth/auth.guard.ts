import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: process.env.AUTH_SECRET,
      })) as {
        sub: string;
        email: string;
        iat: number;
        exp: number;
      };

      const user = await this.userService.findUserById(payload.sub);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...reqUser } = user;

      if (!user) {
        throw new UnauthorizedException();
      }

      request['user'] = reqUser;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
