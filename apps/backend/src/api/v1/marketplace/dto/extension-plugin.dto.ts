import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const EXTENSION_STATUSES = ['installed', 'enabled', 'disabled', 'uninstalled'] as const;
const PLUGIN_STATUSES = ['active', 'deprecated', 'archived'] as const;

export class InstallExtensionDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() currentVersion!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() pluginId?: string;
}

export class UpgradeExtensionDto {
  @ApiProperty() @IsString() toVersion!: string;
}

export class ListExtensionsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: EXTENSION_STATUSES })
  @IsOptional()
  @IsIn(EXTENSION_STATUSES)
  status?: (typeof EXTENSION_STATUSES)[number];
}

export class RegisterPluginDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredPermissions?: string[];
  @ApiProperty() @IsString() compatibleVersionRange!: string;
}

export class CheckCompatibilityDto {
  @ApiProperty() @IsString() hostVersion!: string;
}

export class ListPluginsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: PLUGIN_STATUSES })
  @IsOptional()
  @IsIn(PLUGIN_STATUSES)
  status?: (typeof PLUGIN_STATUSES)[number];
}
