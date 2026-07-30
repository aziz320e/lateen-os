import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;
const ACCOUNT_STATUSES = ['draft', 'active', 'inactive', 'archived'] as const;

export class CreateFinanceAccountDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: ACCOUNT_TYPES })
  @IsIn(ACCOUNT_TYPES)
  accountType!: (typeof ACCOUNT_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() parentAccountId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateFinanceAccountDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentAccountId?: string;
}

export class ListFinanceAccountsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: ACCOUNT_TYPES })
  @IsOptional()
  @IsIn(ACCOUNT_TYPES)
  accountType?: (typeof ACCOUNT_TYPES)[number];
  @ApiPropertyOptional({ enum: ACCOUNT_STATUSES })
  @IsOptional()
  @IsIn(ACCOUNT_STATUSES)
  status?: (typeof ACCOUNT_STATUSES)[number];
}
