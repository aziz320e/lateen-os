import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { MarketplaceController } from './marketplace.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [MarketplaceController],
})
export class MarketplaceApiModule {}
