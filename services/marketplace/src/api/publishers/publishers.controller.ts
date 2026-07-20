import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { PUBLISHER_SERVICE } from '../tokens';
import type { PublisherService } from '../../application/marketplace.services';

@Controller('api/publishers')
export class PublishersController {
  constructor(@Inject(PUBLISHER_SERVICE) private readonly publishers: PublisherService) {}

  @Get()
  listPublishers() {
    return this.publishers.listPublishers();
  }

  @Get(':slug')
  async getPublisher(@Param('slug') slug: string) {
    const publisher = await this.publishers.getPublisherBySlug(slug);
    if (!publisher) throw new NotFoundException('Publisher not found');
    return publisher;
  }
}
