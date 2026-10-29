import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err) {
      throw err;
    }
    if (!user) {
      throw new UnauthorizedException('Authentication required: missing or invalid access token.');
    }
    return user;
  }
}
