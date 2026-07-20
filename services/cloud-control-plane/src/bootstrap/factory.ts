import { CloudService } from '../application/cloud.service';
import { loadConfig } from '../config/index';
import { InMemoryCloudRepository } from '../repositories/in-memory-repository';

export function createCloudService(config = loadConfig()): CloudService {
  return new CloudService(new InMemoryCloudRepository(), config);
}
