import { Controller, Get } from '@nestjs/common';
import packageJson from '../../../package.json' with { type: 'json' };

@Controller()
export class VersionController {
  @Get('version')
  version() {
    return {
      service: packageJson.name,
      version: packageJson.version,
      nodeVersion: process.version,
    };
  }
}
