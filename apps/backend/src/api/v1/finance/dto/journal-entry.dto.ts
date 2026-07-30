import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsISO8601, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const JOURNAL_ENTRY_STATUSES = ['draft', 'posted', 'reversed'] as const;

export class JournalLineDto {
  @ApiProperty() @IsString() accountId!: string;
  @ApiProperty() @IsString() debit!: string;
  @ApiProperty() @IsString() credit!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty() @IsISO8601() entryDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() memo?: string;
  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
  @ApiProperty() @IsString() currency!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() fiscalPeriodId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() entryNumber?: string;
}

export class ReverseJournalEntryDto {
  @ApiProperty() @IsISO8601() entryDate!: string;
}

export class ListJournalEntriesDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() accountId?: string;
  @ApiPropertyOptional({ enum: JOURNAL_ENTRY_STATUSES })
  @IsOptional()
  @IsIn(JOURNAL_ENTRY_STATUSES)
  status?: (typeof JOURNAL_ENTRY_STATUSES)[number];
}
