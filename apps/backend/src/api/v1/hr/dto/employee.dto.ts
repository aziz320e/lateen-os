import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsISO8601, IsIn, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contractor', 'intern'] as const;
const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'suspended', 'terminated'] as const;

export class HireEmployeeDto {
  @ApiProperty() @IsString() firstName!: string;
  @ApiProperty() @IsString() lastName!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty() @IsString() positionId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerId?: string;
  @ApiProperty({ enum: EMPLOYMENT_TYPES })
  @IsIn(EMPLOYMENT_TYPES)
  employmentType!: (typeof EMPLOYMENT_TYPES)[number];
  @ApiProperty() @IsString() baseSalary!: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiProperty() @IsISO8601() hireDate!: string;
}

export class TransferEmployeeDto {
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() positionId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerId?: string;
}

export class PromoteEmployeeDto {
  @ApiProperty() @IsString() positionId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() newBaseSalary?: string;
}

export class TerminateEmployeeDto {
  @ApiProperty() @IsISO8601() terminationDate!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}

export class RehireEmployeeDto {
  @ApiProperty() @IsISO8601() rehireDate!: string;
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty() @IsString() positionId!: string;
}

export class ListEmployeesDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional({ enum: EMPLOYMENT_STATUSES })
  @IsOptional()
  @IsIn(EMPLOYMENT_STATUSES)
  employmentStatus?: (typeof EMPLOYMENT_STATUSES)[number];
}
