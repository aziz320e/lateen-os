import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from '@nestjs/common';
import { PROVISIONING_SERVICE } from '../tokens';
import type { ProvisioningService } from '../../application/provisioning.service';
import type { ProvisioningRequest } from '../../domain/types';
import { PROVISIONING_PROFILES } from '../../profiles/definitions';

@Controller('api/provision')
export class ProvisionController {
  constructor(@Inject(PROVISIONING_SERVICE) private readonly provisioning: ProvisioningService) {}

  @Post()
  create(@Body() body: ProvisioningRequest) {
    return this.provisioning.startProvisioning(body);
  }

  @Get('status')
  getStatus() {
    return this.provisioning.getStatus();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const job = await this.provisioning.getJob(id);
    if (!job) throw new NotFoundException('Provisioning job not found');
    return job;
  }
}

@Controller('api/profiles')
export class ProfilesController {
  @Get()
  listProfiles() {
    return PROVISIONING_PROFILES;
  }
}
