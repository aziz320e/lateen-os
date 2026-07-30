import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ACTIVITY_TYPES = ['call', 'meeting', 'email', 'note', 'task'] as const;
const RELATED_ENTITY_TYPES = ['customer', 'lead', 'contact', 'account', 'opportunity'] as const;

export class ListActivitiesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ACTIVITY_TYPES })
  @IsOptional()
  @IsIn(ACTIVITY_TYPES)
  activityType?: (typeof ACTIVITY_TYPES)[number];
  @ApiPropertyOptional({ enum: RELATED_ENTITY_TYPES })
  @IsOptional()
  @IsIn(RELATED_ENTITY_TYPES)
  relatedEntityType?: (typeof RELATED_ENTITY_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() relatedEntityId?: string;
}

export class ActivityRelatedEntityDto {
  @ApiProperty({ enum: RELATED_ENTITY_TYPES })
  @IsIn(RELATED_ENTITY_TYPES)
  entityType!: (typeof RELATED_ENTITY_TYPES)[number];
  @ApiProperty() @IsString() entityId!: string;
}

export class LogActivityDto {
  @ApiProperty({ enum: ACTIVITY_TYPES })
  @IsIn(ACTIVITY_TYPES)
  activityType!: (typeof ACTIVITY_TYPES)[number];
  @ApiProperty() @IsString() subject!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: ActivityRelatedEntityDto })
  @ValidateNested()
  @Type(() => ActivityRelatedEntityDto)
  relatedTo!: ActivityRelatedEntityDto;
  @ApiPropertyOptional() @IsOptional() @IsString() authorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() occurredAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() dueAt?: string;
}
