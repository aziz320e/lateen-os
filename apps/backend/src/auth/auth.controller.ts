import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AppConfig } from '../config/index.js';
import { APP_CONFIG } from '../api/tokens.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from './decorators.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AccessTokenPayload } from './token.service.js';

const ACCESS_TOKEN_COOKIE = 'lateen_access_token';
const REFRESH_TOKEN_COOKIE = 'lateen_refresh_token';

interface LoginBody {
  readonly organizationId?: string;
  readonly email?: string;
  readonly password?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string): void {
    const secure = this.config.COOKIE_SECURE;
    reply.setCookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: this.config.ACCESS_TOKEN_TTL_SECONDS,
    });
    reply.setCookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/auth',
      maxAge: this.config.REFRESH_TOKEN_TTL_SECONDS,
    });
  }

  private clearAuthCookies(reply: FastifyReply): void {
    reply.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    reply.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/auth' });
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginBody,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    if (!body.organizationId || !body.email || !body.password) {
      throw new BadRequestException('organizationId, email, and password are required.');
    }

    const result = await this.auth.login(
      { organizationId: body.organizationId, email: body.email, password: body.password },
      { userAgent: request.headers['user-agent'], ipAddress: request.ip },
    );

    this.setAuthCookies(reply, result.accessToken, result.refreshToken);
    return { user: result.user, roles: result.roles, permissions: result.permissions };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AccessTokenPayload,
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    if (refreshToken) {
      await this.auth.logout(user.organizationId, refreshToken);
    }
    this.clearAuthCookies(reply);
    return { loggedOut: true };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const refreshToken = request.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!refreshToken) throw new BadRequestException('No refresh token presented.');

    // The organization is never taken from the request — it is derived
    // exclusively from the refresh token's own session/user inside
    // AuthService.refresh(), so a caller cannot mint a token for an
    // organization other than the one the refresh token actually belongs to.
    const result = await this.auth.refresh(refreshToken);
    this.setAuthCookies(reply, result.accessToken, result.refreshToken);
    return { refreshed: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AccessTokenPayload) {
    const profile = await this.auth.me(user.sub);
    if (!profile) throw new BadRequestException('User no longer exists.');
    return profile;
  }
}
