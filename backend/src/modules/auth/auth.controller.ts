import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request, Response } from 'express';
import {
  clearRefreshSessionCookie,
  CsrfOriginGuard,
  extractCookieValue,
  REFRESH_COOKIE_NAME,
  setRefreshSessionCookie,
} from '../../common/auth';
import { SanitizedUserProfile } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthHttpResponse {
  user: SanitizedUserProfile;
  accessToken: string;
  expiresInSeconds: number;
}

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthHttpResponse> {
    const result = await this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    setRefreshSessionCookie(
      res,
      result.refreshCookieValue,
      result.refreshCookieMaxAgeMs,
      this.isProduction,
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresInSeconds: result.expiresInSeconds,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthHttpResponse> {
    const result = await this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    setRefreshSessionCookie(
      res,
      result.refreshCookieValue,
      result.refreshCookieMaxAgeMs,
      this.isProduction,
    );

    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresInSeconds: result.expiresInSeconds,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfOriginGuard)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthHttpResponse> {
    const rawCookie = extractCookieValue(req, REFRESH_COOKIE_NAME);

    try {
      const result = await this.authService.refresh(rawCookie, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      setRefreshSessionCookie(
        res,
        result.refreshCookieValue,
        result.refreshCookieMaxAgeMs,
        this.isProduction,
      );

      return {
        user: result.user,
        accessToken: result.accessToken,
        expiresInSeconds: result.expiresInSeconds,
      };
    } catch (error) {
      clearRefreshSessionCookie(res, this.isProduction);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfOriginGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ loggedOut: true }> {
    const rawCookie = extractCookieValue(req, REFRESH_COOKIE_NAME);
    const result = await this.authService.logout(rawCookie);
    clearRefreshSessionCookie(res, this.isProduction);
    return result;
  }
}
