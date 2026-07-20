import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiKeyService } from '../../application/api-key.service';
import type { AuthService } from '../../application/auth.service';
import type { ServiceAccountService } from '../../application/service-account.service';
import { API_KEY_SERVICE, AUTH_SERVICE, SERVICE_ACCOUNT_SERVICE } from '../../api/tokens';

const loginSchema = z.object({
  organizationId: z.string().uuid(),
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const createApiKeySchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional(),
});

const createServiceAccountSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

function extractBearer(authHeader?: string): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  return authHeader.slice(7);
}

function clientMeta(req: FastifyRequest) {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

@Controller('api/v1/auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    @Inject(API_KEY_SERVICE) private readonly apiKeyService: ApiKeyService,
    @Inject(SERVICE_ACCOUNT_SERVICE) private readonly serviceAccountService: ServiceAccountService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: unknown, @Req() req: FastifyRequest) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) throw new HttpException(parsed.error.message, HttpStatus.BAD_REQUEST);
    try {
      return await this.authService.login({ ...parsed.data, ...clientMeta(req) });
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Login failed', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: unknown, @Req() req: FastifyRequest) {
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) throw new HttpException(parsed.error.message, HttpStatus.BAD_REQUEST);
    try {
      return await this.authService.refresh({ ...parsed.data, ...clientMeta(req) });
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Refresh failed', HttpStatus.UNAUTHORIZED);
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: unknown, @Req() req: FastifyRequest) {
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) throw new HttpException(parsed.error.message, HttpStatus.BAD_REQUEST);
    const token = extractBearer(req.headers.authorization);
    await this.authService.logout(parsed.data.refreshToken, token ?? 'anonymous', req.ip);
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const token = extractBearer(authorization);
    if (!token) throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    try {
      return await this.authService.me(token);
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('api-keys')
  async listApiKeys(@Headers('x-organization-id') organizationId?: string) {
    if (!organizationId) throw new HttpException('X-Organization-Id required', HttpStatus.BAD_REQUEST);
    return this.apiKeyService.list(organizationId);
  }

  @Post('api-keys')
  async createApiKey(@Body() body: unknown, @Headers('authorization') authorization?: string) {
    const parsed = createApiKeySchema.safeParse(body);
    if (!parsed.success) throw new HttpException(parsed.error.message, HttpStatus.BAD_REQUEST);
    const actor = extractBearer(authorization) ?? 'system';
    try {
      return await this.apiKeyService.create({
        ...parsed.data,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        actorSubject: actor,
      });
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Create failed', HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeApiKey(
    @Param('id') id: string,
    @Headers('x-organization-id') organizationId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    if (!organizationId) throw new HttpException('X-Organization-Id required', HttpStatus.BAD_REQUEST);
    const actor = extractBearer(authorization) ?? 'system';
    await this.apiKeyService.revoke(id, organizationId, actor);
  }

  @Get('service-accounts')
  async listServiceAccounts(@Headers('x-organization-id') organizationId?: string) {
    if (!organizationId) throw new HttpException('X-Organization-Id required', HttpStatus.BAD_REQUEST);
    return this.serviceAccountService.list(organizationId);
  }

  @Post('service-accounts')
  async createServiceAccount(@Body() body: unknown, @Headers('authorization') authorization?: string) {
    const parsed = createServiceAccountSchema.safeParse(body);
    if (!parsed.success) throw new HttpException(parsed.error.message, HttpStatus.BAD_REQUEST);
    const actor = extractBearer(authorization) ?? 'system';
    try {
      return await this.serviceAccountService.create({ ...parsed.data, actorSubject: actor });
    } catch (error) {
      throw new HttpException(error instanceof Error ? error.message : 'Create failed', HttpStatus.BAD_REQUEST);
    }
  }
}
