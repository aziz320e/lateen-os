import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { APP_CONFIG, REVIEW_SERVICE } from '../tokens';
import { resolveOrganizationId } from '../org-context';
import type { AppConfig } from '../../config/index';
import type { ReviewService } from '../../application/marketplace.services';

@Controller('api/reviews')
export class ReviewsController {
  constructor(
    @Inject(REVIEW_SERVICE) private readonly reviews: ReviewService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get(':extensionId')
  listReviews(@Param('extensionId') extensionId: string) {
    return this.reviews.listReviews(extensionId);
  }

  @Get(':extensionId/ratings')
  getRatings(@Param('extensionId') extensionId: string) {
    return this.reviews.getRatingSummary(extensionId);
  }

  @Post(':extensionId')
  createReview(
    @Param('extensionId') extensionId: string,
    @Body() body: { rating: number; comment?: string; releaseId?: string; authorId: string; verifiedInstall?: boolean },
    @Req() req: FastifyRequest,
  ) {
    const organizationId = resolveOrganizationId(req, this.config.DEFAULT_ORGANIZATION_ID);
    return this.reviews.createReview(extensionId, {
      organizationId,
      authorId: body.authorId,
      rating: body.rating,
      comment: body.comment,
      releaseId: body.releaseId,
      verifiedInstall: body.verifiedInstall ?? false,
    });
  }
}
