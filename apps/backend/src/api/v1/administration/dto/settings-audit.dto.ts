import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../common/list-query.dto.js';

export class UpsertSettingDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty({ description: 'Arbitrary JSON value' }) @IsDefined() value!: unknown;
}

const SETTING_SCOPES = ['global', 'tenant', 'organization'] as const;

export class ListSettingsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: SETTING_SCOPES })
  @IsOptional()
  @IsIn(SETTING_SCOPES)
  scope?: (typeof SETTING_SCOPES)[number];
}

const CONFIG_FIELD_TYPES = ['string', 'number', 'boolean', 'object', 'array'] as const;

export class ConfigFieldSchemaDto {
  @ApiProperty() @IsString() field!: string;
  @ApiProperty({ enum: CONFIG_FIELD_TYPES })
  @IsIn(CONFIG_FIELD_TYPES)
  type!: (typeof CONFIG_FIELD_TYPES)[number];
  @ApiProperty() @IsBoolean() required!: boolean;
}

export class SetRuntimeConfigDto {
  @ApiPropertyOptional() @IsOptional() @IsString() environmentId?: string;
  @ApiProperty() @IsString() key!: string;
  @ApiProperty({ description: 'Arbitrary JSON value' }) @IsDefined() value!: unknown;
  @ApiPropertyOptional({ type: [ConfigFieldSchemaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigFieldSchemaDto)
  schema?: ConfigFieldSchemaDto[];
}

export class AuditActorDto {
  @ApiProperty() @IsString() id!: string;
  @ApiProperty() @IsString() type!: string;
}

export class AuditTargetDto {
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @IsString() id!: string;
}

export class RecordAuditDto {
  @ApiProperty({ type: AuditActorDto })
  @ValidateNested()
  @Type(() => AuditActorDto)
  actor!: AuditActorDto;
  @ApiProperty() @IsString() action!: string;
  @ApiProperty({ type: AuditTargetDto })
  @ValidateNested()
  @Type(() => AuditTargetDto)
  target!: AuditTargetDto;
  @ApiPropertyOptional() @IsOptional() metadata?: Record<string, unknown>;
}

export class ListAuditsDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() action?: string;
}
