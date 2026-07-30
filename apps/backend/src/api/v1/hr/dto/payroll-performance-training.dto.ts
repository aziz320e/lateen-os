import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsISO8601,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListQueryDto } from '../../common/list-query.dto.js';

const PAYROLL_RUN_STATUSES = ['draft', 'finalized'] as const;

export class PreparePayrollDto {
  @ApiProperty() @IsISO8601() periodStart!: string;
  @ApiProperty() @IsISO8601() periodEnd!: string;
  @ApiProperty() @IsString() currency!: string;
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) employeeIds!: string[];
  @ApiPropertyOptional() @IsOptional() allowancesByEmployee?: Record<
    string,
    { label: string; amount: string }[]
  >;
  @ApiPropertyOptional() @IsOptional() deductionsByEmployee?: Record<
    string,
    { label: string; amount: string }[]
  >;
}

export class ListPayrollRunsDto extends ListQueryDto {
  @ApiPropertyOptional({ enum: PAYROLL_RUN_STATUSES })
  @IsOptional()
  @IsIn(PAYROLL_RUN_STATUSES)
  status?: (typeof PAYROLL_RUN_STATUSES)[number];
}

export class CreateReviewPeriodDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsISO8601() startDate!: string;
  @ApiProperty() @IsISO8601() endDate!: string;
}

export class CreateObjectiveDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty() @IsString() reviewPeriodId!: string;
  @ApiProperty() @IsString() description!: string;
  @ApiProperty() @IsString() weightPct!: string;
}

const OBJECTIVE_STATUSES = ['in_progress', 'completed', 'missed'] as const;
export class UpdateObjectiveStatusDto {
  @ApiProperty({ enum: OBJECTIVE_STATUSES })
  @IsIn(OBJECTIVE_STATUSES)
  status!: (typeof OBJECTIVE_STATUSES)[number];
}

export class ObjectiveRatingDto {
  @ApiProperty() @IsString() objectiveId!: string;
  @ApiProperty() @IsNumber() rating!: number;
}

export class CreateEvaluationDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty() @IsString() reviewPeriodId!: string;
  @ApiProperty({ type: [ObjectiveRatingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ObjectiveRatingDto)
  objectiveRatings!: ObjectiveRatingDto[];
}

export class CreateCourseDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsNumber() durationHours!: number;
}

export class CreateCertificationDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issuingBody?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() validityMonths?: number;
}

const SKILL_PROFICIENCIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export class RecordSkillDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty() @IsString() skillName!: string;
  @ApiProperty({ enum: SKILL_PROFICIENCIES })
  @IsIn(SKILL_PROFICIENCIES)
  proficiency!: (typeof SKILL_PROFICIENCIES)[number];
}

export class RecordCompletionDto {
  @ApiProperty() @IsString() employeeId!: string;
  @ApiProperty() @IsString() courseId!: string;
  @ApiProperty() @IsISO8601() completedAt!: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() score?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() certificationId?: string;
}

export class ListTrainingDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() employeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() courseId?: string;
}

export class ListPerformanceDto extends ListQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() employeeId?: string;
}
