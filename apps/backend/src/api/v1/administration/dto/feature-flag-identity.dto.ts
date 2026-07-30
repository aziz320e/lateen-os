import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

export class RegisterFeatureFlagDto {
  @ApiProperty() @IsString() key!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tenantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() environmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
}

const USER_STATUSES = ['active', 'suspended', 'deactivated'] as const;
const ROLE_STATUSES = ['active', 'archived'] as const;

export class CreatePermissionDto {
  @ApiProperty() @IsString() code!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateRoleDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionCodes?: string[];
}

export class ListRolesDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ROLE_STATUSES })
  @IsOptional()
  @IsIn(ROLE_STATUSES)
  status?: (typeof ROLE_STATUSES)[number];
}

export class CreateGroupDto {
  @ApiProperty() @IsString() name!: string;
}

export class CreateAdminUserDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() displayName!: string;
}

export class ListAdminUsersDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: USER_STATUSES })
  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: (typeof USER_STATUSES)[number];
}
