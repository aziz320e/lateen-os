import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDefined, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ISOLATION_LEVELS = ['none', 'process', 'container', 'vm'] as const;

export class CreateSandboxProfileDto {
  @ApiProperty() @IsString() extensionId!: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCapabilities?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantedPermissions?: string[];
  @ApiPropertyOptional({ enum: ISOLATION_LEVELS })
  @IsOptional()
  @IsIn(ISOLATION_LEVELS)
  isolationLevel?: (typeof ISOLATION_LEVELS)[number];
}

export class SetExtensionConfigDto {
  @ApiProperty() @IsString() extensionId!: string;
  @ApiProperty() @IsString() key!: string;
  @ApiProperty({ description: 'Arbitrary JSON value' }) @IsDefined() value!: unknown;
}

export class ListExtensionConfigurationsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() extensionId?: string;
}

export class DeclareEventDto {
  @ApiProperty() @IsString() extensionId!: string;
  @ApiProperty() @IsString() eventName!: string;
}
