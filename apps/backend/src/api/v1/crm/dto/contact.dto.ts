import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const CONTACT_STATUSES = ['active', 'archived'] as const;

export class ListContactsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: CONTACT_STATUSES })
  @IsOptional()
  @IsIn(CONTACT_STATUSES)
  status?: (typeof CONTACT_STATUSES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
}

export class CreateContactDto {
  @ApiProperty() @IsString() firstName!: string;
  @ApiProperty() @IsString() lastName!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateContactDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
