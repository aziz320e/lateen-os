import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ORGANIZATION_PLANS = ['free', 'starter', 'business', 'enterprise'] as const;
const ORGANIZATION_STATUSES = ['active', 'suspended', 'archived'] as const;

export class RegisterOrganizationDto {
  @ApiProperty() @IsString() organizationId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ enum: ORGANIZATION_PLANS })
  @IsOptional()
  @IsIn(ORGANIZATION_PLANS)
  plan?: (typeof ORGANIZATION_PLANS)[number];
}

export class ListOrganizationsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ORGANIZATION_STATUSES })
  @IsOptional()
  @IsIn(ORGANIZATION_STATUSES)
  status?: (typeof ORGANIZATION_STATUSES)[number];
}

const TENANT_STATUSES = ['active', 'suspended', 'archived'] as const;
const ENVIRONMENT_TYPES = ['development', 'staging', 'production'] as const;

export class CreateTenantDto {
  @ApiProperty() @IsString() name!: string;
}

export class ListTenantsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: TENANT_STATUSES })
  @IsOptional()
  @IsIn(TENANT_STATUSES)
  status?: (typeof TENANT_STATUSES)[number];
}

export class CreateEnvironmentDto {
  @ApiProperty() @IsString() tenantId!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: ENVIRONMENT_TYPES })
  @IsIn(ENVIRONMENT_TYPES)
  environmentType!: (typeof ENVIRONMENT_TYPES)[number];
}
