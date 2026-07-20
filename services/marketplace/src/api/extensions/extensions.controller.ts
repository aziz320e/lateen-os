import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { EXTENSION_SERVICE } from '../tokens';
import type { ExtensionService } from '../../application/marketplace.services';

@Controller('api/extensions')
export class ExtensionsController {
  constructor(@Inject(EXTENSION_SERVICE) private readonly extensions: ExtensionService) {}

  @Get()
  listExtensions() {
    return this.extensions.listExtensions();
  }

  @Get(':extensionId')
  async getExtension(@Param('extensionId') extensionId: string) {
    const extension = await this.extensions.getExtensionBySlug(extensionId);
    if (!extension) throw new NotFoundException('Extension not found');
    return extension;
  }
}
