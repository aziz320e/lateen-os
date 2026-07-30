import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { ListQueryDto } from '../../common/list-query.dto.js';

const UNIT_TYPES = ['department', 'business_unit', 'division'] as const;
const DEPARTMENT_STATUSES = ['active', 'archived'] as const;

export class CreateDepartmentDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty({ enum: UNIT_TYPES }) @IsIn(UNIT_TYPES) unitType!: (typeof UNIT_TYPES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() parentDepartmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class UpdateDepartmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() managerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentDepartmentId?: string;
}

export class ListDepartmentsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: UNIT_TYPES })
  @IsOptional()
  @IsIn(UNIT_TYPES)
  unitType?: (typeof UNIT_TYPES)[number];
  @ApiPropertyOptional({ enum: DEPARTMENT_STATUSES })
  @IsOptional()
  @IsIn(DEPARTMENT_STATUSES)
  status?: (typeof DEPARTMENT_STATUSES)[number];
}

export class CreatePositionDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() departmentId!: string;
  @ApiProperty() @IsString() jobGrade!: string;
  @ApiProperty() @IsString() salaryGrade!: string;
  @ApiProperty() @IsString() baseSalary!: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiProperty() @IsNumber() headcount!: number;
}

export class UpdatePositionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobGrade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() salaryGrade?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() baseSalary?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() headcount?: number;
}
