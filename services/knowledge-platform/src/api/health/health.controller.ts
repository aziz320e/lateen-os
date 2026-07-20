import { Controller, Get } from '@nestjs/common';
import { PIPELINE_STEPS } from '../../domain/types';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'knowledge-platform' };
  }

  @Get('api/pipeline')
  pipeline() {
    return { steps: PIPELINE_STEPS };
  }
}
