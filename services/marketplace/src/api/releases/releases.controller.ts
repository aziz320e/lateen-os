import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PUBLISH_SERVICE, RELEASE_SERVICE } from '../tokens';
import type { PublishService, ReleaseService } from '../../application/marketplace.services';
import type { PublishRequest } from '../../domain/types';

@Controller('api/releases')
export class ReleasesController {
  constructor(
    @Inject(RELEASE_SERVICE) private readonly releases: ReleaseService,
    @Inject(PUBLISH_SERVICE) private readonly publish: PublishService,
  ) {}

  @Get()
  async listReleases(@Query('extensionId') extensionId: string) {
    if (!extensionId) return [];
    return this.releases.listReleases(extensionId);
  }

  @Get(':extensionId/latest')
  async getLatest(
    @Param('extensionId') extensionId: string,
    @Query('channel') channel?: string,
  ) {
    const release = await this.releases.getLatestRelease(
      extensionId,
      channel as import('../../domain/types').ReleaseChannel | undefined,
    );
    if (!release) throw new NotFoundException('Release not found');
    return release;
  }

  @Post('publish')
  publishRelease(@Body() body: PublishRequest) {
    return this.publish.publish(body);
  }
}
